
alter table gym20.public_registration_requests
  add column if not exists converted_student_id uuid,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_by uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'public_registration_requests_converted_student_id_fkey'
      and conrelid = 'gym20.public_registration_requests'::regclass
  ) then
    alter table gym20.public_registration_requests
      add constraint public_registration_requests_converted_student_id_fkey
      foreign key (converted_student_id) references gym20.students(id) on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'public_registration_requests_converted_by_fkey'
      and conrelid = 'gym20.public_registration_requests'::regclass
  ) then
    alter table gym20.public_registration_requests
      add constraint public_registration_requests_converted_by_fkey
      foreign key (converted_by) references gym20.profiles(id) on delete set null;
  end if;
end $$;

alter table gym20.public_registration_requests
  drop constraint if exists public_registration_requests_status_check;
alter table gym20.public_registration_requests
  add constraint public_registration_requests_status_check
  check (status = any (array['pending','approved','rejected','converted']::text[]));

create unique index if not exists public_registration_requests_converted_student_uidx
  on gym20.public_registration_requests(converted_student_id)
  where converted_student_id is not null;

grant usage on schema gym20 to authenticated;
grant select, delete on gym20.public_registration_requests to authenticated;

drop policy if exists registration_requests_owner_select on gym20.public_registration_requests;
create policy registration_requests_owner_select
  on gym20.public_registration_requests
  for select to authenticated
  using ((select gym20.is_active_owner()));

drop policy if exists registration_requests_owner_delete_unconverted on gym20.public_registration_requests;
create policy registration_requests_owner_delete_unconverted
  on gym20.public_registration_requests
  for delete to authenticated
  using (
    (select gym20.is_active_owner())
    and converted_student_id is null
  );

create or replace function gym20.update_registration_request_status(
  p_request_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  if p_status not in ('pending','approved','rejected') then
    raise exception 'وضعیت انتخاب‌شده معتبر نیست.';
  end if;

  update gym20.public_registration_requests
     set status = p_status
   where id = p_request_id
     and converted_student_id is null
     and status <> 'converted';

  if not found then
    raise exception 'درخواست پیدا نشد یا قبلاً به هنرجو تبدیل شده است.';
  end if;
end;
$function$;

revoke all on function gym20.update_registration_request_status(uuid,text) from public, anon;
grant execute on function gym20.update_registration_request_status(uuid,text) to authenticated;

create or replace function gym20.convert_registration_request(p_request_id uuid)
returns table(student_id uuid, enrollment_count integer)
language plpgsql
security definer
set search_path = ''
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
      student_id, course_id, package_type, total_sessions, start_date, status
    )
    values (
      v_student_id, v_course_id, 'sessions',
      v_request.total_sessions, current_date, 'active'
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
