-- One class_sessions row represents one meeting in the term.
-- A meeting may cover one or several selected styles.
create table if not exists gym20.class_session_styles (
  session_id uuid not null references gym20.class_sessions(id) on delete cascade,
  enrollment_id uuid not null references gym20.enrollments(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (session_id, enrollment_id)
);
alter table gym20.class_session_styles enable row level security;
drop policy if exists class_session_styles_owner_all on gym20.class_session_styles;
create policy class_session_styles_owner_all on gym20.class_session_styles
  for all to authenticated
  using ((select gym20.is_active_owner()))
  with check ((select gym20.is_active_owner()));
grant select, insert, update, delete on gym20.class_session_styles to authenticated;

create or replace function gym20.replace_term_draft_sessions(p_version_id uuid, p_sessions jsonb)
returns integer
language plpgsql
set search_path = ''
as $function$
declare
  v_term_id uuid;
  v_total integer;
  v_duration integer;
  v_student_id uuid;
  v_inserted integer := 0;
  v_session_id uuid;
  v_session_rec record;
  v_course_id uuid;
  v_enrollment_id uuid;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;
  if p_sessions is null or jsonb_typeof(p_sessions) <> 'array' then
    raise exception 'فهرست جلسات معتبر نیست.';
  end if;
  select t.id,t.total_sessions,t.duration_minutes,t.student_id
    into v_term_id,v_total,v_duration,v_student_id
  from gym20.term_schedule_versions v
  join gym20.student_terms t on t.id=v.term_id
  where v.id=p_version_id and v.status='draft'
  for update of v,t;
  if v_term_id is null then raise exception 'نسخه پیش‌نویس پیدا نشد یا قبلاً منتشر شده است.'; end if;
  if exists (
    select 1 from gym20.class_sessions cs join gym20.attendance a on a.session_id=cs.id
    where cs.schedule_version_id=p_version_id
  ) then raise exception 'برای این پیش‌نویس حضور و غیاب ثبت شده است؛ ویرایش مستقیم مجاز نیست.'; end if;
  if jsonb_array_length(p_sessions) <> v_total then
    raise exception 'تعداد جلسات باید دقیقاً برابر تعداد کل جلسات ترم باشد؛ تعداد سبک‌ها در این عدد ضرب نمی‌شود.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_sessions) as session_row(
      session_number integer, starts_at timestamptz, ends_at timestamptz,
      venue text, notes text, enrollment_ids uuid[]
    )
    where session_row.session_number is null or session_row.session_number < 1 or session_row.session_number > v_total
       or session_row.starts_at is null or session_row.ends_at is null or session_row.ends_at <= session_row.starts_at
       or extract(epoch from (session_row.ends_at-session_row.starts_at)) <> v_duration*60
       or char_length(coalesce(session_row.venue,''))>250 or char_length(coalesce(session_row.notes,''))>1000
       or coalesce(cardinality(session_row.enrollment_ids),0)=0
  ) then raise exception 'اطلاعات یکی از جلسات ناقص یا نامعتبر است؛ برای هر جلسه حداقل یک سبک انتخاب کنید.'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_sessions) as session_row(
      session_number integer, starts_at timestamptz, ends_at timestamptz,
      venue text, notes text, enrollment_ids uuid[]
    ) group by session_row.session_number having count(*)>1
  ) then raise exception 'شماره جلسه تکراری است.'; end if;
  if (select count(distinct session_row.session_number) from jsonb_to_recordset(p_sessions) as session_row(
      session_number integer, starts_at timestamptz, ends_at timestamptz,
      venue text, notes text, enrollment_ids uuid[]
    )) <> v_total then raise exception 'شماره جلسات باید از ۱ تا تعداد کل جلسات ترم کامل باشد.'; end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_sessions) as session_row(
      session_number integer, starts_at timestamptz, ends_at timestamptz,
      venue text, notes text, enrollment_ids uuid[]
    )
    cross join lateral unnest(session_row.enrollment_ids) as ids(enrollment_id)
    left join gym20.term_enrollments te on te.term_id=v_term_id and te.enrollment_id=ids.enrollment_id
    where te.enrollment_id is null
  ) then raise exception 'یکی از سبک‌های جلسه جزو سبک‌های انتخاب‌شده این ترم نیست.'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_sessions) as session_row(
      session_number integer, starts_at timestamptz, ends_at timestamptz,
      venue text, notes text, enrollment_ids uuid[]
    ) cross join lateral unnest(session_row.enrollment_ids) as ids(enrollment_id)
    group by session_row.session_number,ids.enrollment_id having count(*)>1
  ) then raise exception 'یک سبک در یک جلسه دوبار انتخاب شده است.'; end if;
  if exists (
    select 1 from gym20.term_enrollments te
    where te.term_id=v_term_id and not exists (
      select 1 from jsonb_to_recordset(p_sessions) as session_row(
        session_number integer, starts_at timestamptz, ends_at timestamptz,
        venue text, notes text, enrollment_ids uuid[]
      ) cross join lateral unnest(session_row.enrollment_ids) as ids(enrollment_id)
      where ids.enrollment_id=te.enrollment_id
    )
  ) then raise exception 'برای همه سبک‌های انتخاب‌شده باید حداقل یک جلسه اختصاص داده شود.'; end if;

  delete from gym20.class_sessions where schedule_version_id=p_version_id;
  for v_session_rec in select * from jsonb_to_recordset(p_sessions) as session_row(
    session_number integer, starts_at timestamptz, ends_at timestamptz,
    venue text, notes text, enrollment_ids uuid[]
  ) order by session_number
  loop
    v_enrollment_id := session_row.enrollment_ids[1];
    select e.course_id into v_course_id from gym20.enrollments e where e.id=v_enrollment_id;
    insert into gym20.class_sessions(
      course_id,enrollment_id,term_id,schedule_version_id,session_number,
      starts_at,ends_at,venue,notes,status,created_by
    ) values (
      v_course_id,null,v_term_id,p_version_id,session_row.session_number,
      session_row.starts_at,session_row.ends_at,nullif(btrim(coalesce(session_row.venue,'')),''),
      nullif(btrim(coalesce(session_row.notes,'')),''),'scheduled',(select auth.uid())
    ) returning id into v_session_id;
    insert into gym20.class_session_styles(session_id,enrollment_id)
    select v_session_id,ids.enrollment_id from unnest(session_row.enrollment_ids) ids(enrollment_id);
    v_inserted:=v_inserted+1;
  end loop;
  return v_inserted;
end;
$function$;

create or replace function gym20.publish_term_schedule(p_term_id uuid,p_version_id uuid)
returns void
language plpgsql
set search_path = ''
as $function$
declare v_total integer; v_status text; v_count integer;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode='42501';
  end if;
  select t.total_sessions,v.status into v_total,v_status
  from gym20.student_terms t join gym20.term_schedule_versions v on v.term_id=t.id
  where t.id=p_term_id and v.id=p_version_id for update of t,v;
  if v_status is null or v_status<>'draft' then raise exception 'نسخه انتخاب‌شده پیش‌نویس قابل انتشار نیست.'; end if;
  select count(*) into v_count from gym20.class_sessions where schedule_version_id=p_version_id;
  if v_count<>v_total then raise exception 'تعداد جلسات برنامه باید دقیقاً برابر تعداد جلسات کل ترم باشد.'; end if;
  if exists (
    select 1 from gym20.class_sessions cs
    where cs.schedule_version_id=p_version_id
      and not exists(select 1 from gym20.class_session_styles css where css.session_id=cs.id)
  ) then raise exception 'برای هر جلسه حداقل یک سبک باید انتخاب شود.'; end if;
  if exists (
    select 1 from gym20.term_enrollments te
    where te.term_id=p_term_id and not exists (
      select 1 from gym20.class_sessions cs
      join gym20.class_session_styles css on css.session_id=cs.id
      where cs.schedule_version_id=p_version_id and css.enrollment_id=te.enrollment_id
    )
  ) then raise exception 'برای تمام سبک‌های انتخاب‌شده حداقل یک جلسه باید برنامه‌ریزی شود.'; end if;
  update gym20.term_schedule_versions set status='superseded'
   where term_id=p_term_id and status='published';
  update gym20.term_schedule_versions set status='published',published_at=now() where id=p_version_id;
  update gym20.student_terms set published_version_id=p_version_id,updated_at=now() where id=p_term_id;
end;
$function$;

create or replace function gym20.create_term_draft_from_published(p_term_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $function$
declare v_published_id uuid; v_draft_id uuid; v_next_version integer; v_old record; v_new_session_id uuid;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode='42501';
  end if;
  perform 1 from gym20.student_terms where id=p_term_id for update;
  if not found then raise exception 'ترم پیدا نشد.'; end if;
  select id into v_draft_id from gym20.term_schedule_versions where term_id=p_term_id and status='draft' limit 1;
  if v_draft_id is not null then return v_draft_id; end if;
  select published_version_id into v_published_id from gym20.student_terms where id=p_term_id;
  select coalesce(max(version_number),0)+1 into v_next_version from gym20.term_schedule_versions where term_id=p_term_id;
  insert into gym20.term_schedule_versions(term_id,version_number,status,created_by)
  values(p_term_id,v_next_version,'draft',(select auth.uid())) returning id into v_draft_id;
  if v_published_id is not null then
    for v_old in select * from gym20.class_sessions where schedule_version_id=v_published_id order by session_number loop
      insert into gym20.class_sessions(course_id,enrollment_id,term_id,schedule_version_id,session_number,starts_at,ends_at,venue,notes,status,created_by)
      values(v_old.course_id,v_old.enrollment_id,v_old.term_id,v_draft_id,v_old.session_number,v_old.starts_at,v_old.ends_at,v_old.venue,v_old.notes,'scheduled',(select auth.uid()))
      returning id into v_new_session_id;
      insert into gym20.class_session_styles(session_id,enrollment_id)
      select v_new_session_id,css.enrollment_id from gym20.class_session_styles css where css.session_id=v_old.id
      on conflict do nothing;
      if not exists(select 1 from gym20.class_session_styles where session_id=v_new_session_id) and v_old.enrollment_id is not null then
        insert into gym20.class_session_styles(session_id,enrollment_id) values(v_new_session_id,v_old.enrollment_id);
      end if;
    end loop;
  end if;
  return v_draft_id;
end;
$function$;
