
-- GYM20: student terms and versioned class schedules.
-- Additive migration: preserves existing students, enrollments, sessions and attendance.

alter table gym20.enrollments
  add column if not exists class_type text not null default 'normal',
  add column if not exists age_group text not null default 'adult';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'gym20.enrollments'::regclass
      and conname = 'enrollments_class_type_check'
  ) then
    alter table gym20.enrollments
      add constraint enrollments_class_type_check
      check (class_type in ('normal','semi','private','vip','online'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'gym20.enrollments'::regclass
      and conname = 'enrollments_age_group_check'
  ) then
    alter table gym20.enrollments
      add constraint enrollments_age_group_check
      check (age_group in ('adult','kids'));
  end if;
end $$;

-- Backfill the original class type and age group from the source registration.
update gym20.enrollments e
set class_type = coalesce(r.class_type, 'normal'),
    age_group = coalesce(r.age_group, 'adult')
from gym20.public_registration_requests r
where r.converted_student_id = e.student_id
  and r.status = 'converted';

create table if not exists gym20.student_terms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references gym20.students(id) on delete restrict,
  term_name text not null,
  term_order integer,
  start_date date,
  end_date date,
  total_sessions integer not null default 8 check (total_sessions > 0 and total_sessions <= 100),
  duration_minutes integer not null default 60 check (duration_minutes in (60,90)),
  default_venue text,
  schedule_mode text not null default 'manual' check (schedule_mode in ('weekly','manual')),
  status text not null default 'active' check (status in ('active','completed','archived')),
  published_version_id uuid,
  created_by uuid references gym20.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_terms_date_check check (end_date is null or start_date is null or end_date >= start_date),
  constraint student_terms_name_check check (char_length(btrim(term_name)) between 1 and 100),
  constraint student_terms_student_name_key unique (student_id, term_name)
);

create table if not exists gym20.term_enrollments (
  term_id uuid not null references gym20.student_terms(id) on delete cascade,
  enrollment_id uuid not null references gym20.enrollments(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (term_id, enrollment_id)
);

create table if not exists gym20.term_schedule_versions (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references gym20.student_terms(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft','published','superseded')),
  notes text,
  created_by uuid references gym20.profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (term_id, version_number)
);

alter table gym20.student_terms
  add constraint student_terms_published_version_fkey
  foreign key (published_version_id)
  references gym20.term_schedule_versions(id)
  on delete set null;

alter table gym20.class_sessions
  add column if not exists term_id uuid references gym20.student_terms(id) on delete restrict,
  add column if not exists schedule_version_id uuid references gym20.term_schedule_versions(id) on delete restrict,
  add column if not exists session_number integer,
  add column if not exists venue text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'gym20.class_sessions'::regclass
      and conname = 'class_sessions_session_number_check'
  ) then
    alter table gym20.class_sessions
      add constraint class_sessions_session_number_check
      check (session_number is null or session_number > 0);
  end if;
end $$;

create unique index if not exists class_sessions_version_enrollment_number_key
  on gym20.class_sessions(schedule_version_id, enrollment_id, session_number)
  where schedule_version_id is not null and enrollment_id is not null and session_number is not null;

create index if not exists student_terms_student_created_idx
  on gym20.student_terms(student_id, created_at desc);
create index if not exists term_enrollments_enrollment_idx
  on gym20.term_enrollments(enrollment_id);
create index if not exists term_schedule_versions_term_idx
  on gym20.term_schedule_versions(term_id, version_number desc);
create unique index if not exists term_schedule_one_draft_per_term
  on gym20.term_schedule_versions(term_id)
  where status = 'draft';
create index if not exists class_sessions_term_version_start_idx
  on gym20.class_sessions(term_id, schedule_version_id, starts_at);

alter table gym20.student_terms enable row level security;
alter table gym20.term_enrollments enable row level security;
alter table gym20.term_schedule_versions enable row level security;

drop policy if exists owner_manage_all on gym20.student_terms;
create policy owner_manage_all on gym20.student_terms
  for all to authenticated
  using (gym20.is_active_owner())
  with check (gym20.is_active_owner());

drop policy if exists owner_manage_all on gym20.term_enrollments;
create policy owner_manage_all on gym20.term_enrollments
  for all to authenticated
  using (gym20.is_active_owner())
  with check (gym20.is_active_owner());

drop policy if exists owner_manage_all on gym20.term_schedule_versions;
create policy owner_manage_all on gym20.term_schedule_versions
  for all to authenticated
  using (gym20.is_active_owner())
  with check (gym20.is_active_owner());

grant select, insert, update, delete on gym20.student_terms to authenticated;
grant select, insert, update, delete on gym20.term_enrollments to authenticated;
grant select, insert, update, delete on gym20.term_schedule_versions to authenticated;
grant select, insert, update, delete on gym20.class_sessions to authenticated;
grant select, insert, update, delete on gym20.attendance to authenticated;

-- Correctly retain the registration's actual class type and age group on every enrollment.
create or replace function gym20.convert_registration_request(p_request_id uuid)
returns table(student_id uuid, enrollment_count integer)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner_id uuid;
  v_request gym20.public_registration_requests%rowtype;
  v_student_id uuid;
  v_style text;
  v_course_name text;
  v_course_id uuid;
  v_count integer := 0;
begin
  v_owner_id := (select auth.uid());
  if v_owner_id is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  select *
    into v_request
    from gym20.public_registration_requests
   where id = p_request_id
   for update;

  if not found then
    raise exception 'درخواست ثبت‌نام پیدا نشد.';
  end if;

  if v_request.converted_student_id is not null or v_request.status = 'converted' then
    raise exception 'این درخواست قبلاً به هنرجو تبدیل شده است.';
  end if;

  if v_request.status = 'rejected' then
    raise exception 'ابتدا وضعیت درخواست ردشده را اصلاح کنید.';
  end if;

  if coalesce(cardinality(v_request.selected_styles),0) = 0 then
    raise exception 'درخواست هیچ سبک ورزشی معتبری ندارد.';
  end if;

  insert into gym20.students(full_name, phone, birth_date, notes, is_active)
  values (
    v_request.full_name,
    v_request.phone,
    v_request.birth_date,
    v_request.notes,
    true
  )
  returning id into v_student_id;

  for v_style in
    select distinct btrim(s.style_name)
      from unnest(v_request.selected_styles) as s(style_name)
     order by 1
  loop
    v_course_name := case
      when v_style ilike '%بریک%دنس%' then 'بریک‌دنس'
      when v_style ilike '%بوکس%' then 'بوکس'
      when v_style ilike '%پارکور%' then 'پارکور'
      when v_style ilike '%کلیستنیکس%' or v_style ilike '%کالیستنیکس%' then 'کالیستنیکس'
      when v_style ilike '%کیوکوشین%' then 'کاراته کیوکوشین'
      when v_style ilike '%نینجوتسو%' then 'نینجوتسو'
      else null
    end;

    if v_course_name is null then
      raise exception 'سبک «%» در فهرست دوره‌های آکادمی قابل تطبیق نیست؛ تبدیل انجام نشد.', v_style;
    end if;

    select c.id
      into v_course_id
      from gym20.courses c
     where c.name = v_course_name
       and c.is_active = true
     limit 1;

    if v_course_id is null then
      raise exception 'دوره «%» در جدول دوره‌ها فعال نیست؛ تبدیل انجام نشد.', v_course_name;
    end if;

    insert into gym20.enrollments(
      student_id, course_id, package_type, total_sessions, start_date, status,
      class_type, age_group
    )
    values (
      v_student_id, v_course_id, 'sessions',
      v_request.total_sessions, current_date, 'active',
      coalesce(v_request.class_type, 'normal'),
      coalesce(v_request.age_group, 'adult')
    );

    v_count := v_count + 1;
  end loop;

  update gym20.public_registration_requests
     set status = 'converted',
         converted_student_id = v_student_id,
         converted_at = now(),
         converted_by = v_owner_id
   where id = p_request_id;

  return query select v_student_id, v_count;
end;
$function$;

revoke all on function gym20.convert_registration_request(uuid) from public, anon;
grant execute on function gym20.convert_registration_request(uuid) to authenticated;

create or replace function gym20.create_student_term(
  p_student_id uuid,
  p_term_name text,
  p_start_date date,
  p_end_date date,
  p_total_sessions integer,
  p_duration_minutes integer,
  p_default_venue text,
  p_schedule_mode text,
  p_enrollment_ids uuid[]
)
returns table(term_id uuid, draft_version_id uuid)
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_term_id uuid;
  v_version_id uuid;
  v_count integer;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  if p_student_id is null or not exists (
    select 1 from gym20.students s where s.id = p_student_id and s.is_active = true
  ) then
    raise exception 'هنرجوی فعال پیدا نشد.';
  end if;

  if p_term_name is null or char_length(btrim(p_term_name)) not between 1 and 100 then
    raise exception 'نام ترم معتبر نیست.';
  end if;

  if p_total_sessions is null or p_total_sessions < 1 or p_total_sessions > 100 then
    raise exception 'تعداد جلسات معتبر نیست.';
  end if;

  if p_duration_minutes not in (60,90) then
    raise exception 'مدت جلسه باید ۶۰ یا ۹۰ دقیقه باشد.';
  end if;

  if p_schedule_mode not in ('weekly','manual') then
    raise exception 'روش برنامه‌ریزی معتبر نیست.';
  end if;

  if p_end_date is not null and p_start_date is not null and p_end_date < p_start_date then
    raise exception 'تاریخ پایان ترم نمی‌تواند قبل از شروع باشد.';
  end if;

  if coalesce(cardinality(p_enrollment_ids),0) = 0 then
    raise exception 'حداقل یک سبک/ثبت‌نام را انتخاب کنید.';
  end if;

  select count(distinct x) into v_count from unnest(p_enrollment_ids) x;
  if v_count <> cardinality(p_enrollment_ids) then
    raise exception 'یک ثبت‌نام را بیش از یک بار انتخاب کرده‌اید.';
  end if;

  if exists (
    select 1
    from unnest(p_enrollment_ids) x
    left join gym20.enrollments e on e.id = x
    where e.id is null or e.student_id <> p_student_id or e.status not in ('active','paused')
  ) then
    raise exception 'یکی از سبک‌های انتخاب‌شده متعلق به این هنرجو نیست یا ثبت‌نام فعال ندارد.';
  end if;

  insert into gym20.student_terms(
    student_id, term_name, start_date, end_date, total_sessions,
    duration_minutes, default_venue, schedule_mode, created_by
  )
  values (
    p_student_id, btrim(p_term_name), p_start_date, p_end_date, p_total_sessions,
    p_duration_minutes, nullif(btrim(coalesce(p_default_venue,'')), ''),
    p_schedule_mode, (select auth.uid())
  )
  returning id into v_term_id;

  insert into gym20.term_enrollments(term_id, enrollment_id)
  select v_term_id, x from unnest(p_enrollment_ids) x;

  insert into gym20.term_schedule_versions(term_id, version_number, status, created_by)
  values (v_term_id, 1, 'draft', (select auth.uid()))
  returning id into v_version_id;

  return query select v_term_id, v_version_id;
end;
$function$;

revoke all on function gym20.create_student_term(uuid,text,date,date,integer,integer,text,text,uuid[]) from public, anon;
grant execute on function gym20.create_student_term(uuid,text,date,date,integer,integer,text,text,uuid[]) to authenticated;
