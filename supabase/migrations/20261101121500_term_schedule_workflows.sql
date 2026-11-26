
-- Transaction-safe draft editing, publication and version cloning for GYM20 schedules.

create or replace function gym20.replace_term_draft_sessions(
  p_version_id uuid,
  p_sessions jsonb
)
returns integer
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_term_id uuid;
  v_total integer;
  v_duration integer;
  v_inserted integer := 0;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  if p_sessions is null or jsonb_typeof(p_sessions) <> 'array' then
    raise exception 'فهرست جلسات معتبر نیست.';
  end if;

  select t.id, t.total_sessions, t.duration_minutes
    into v_term_id, v_total, v_duration
    from gym20.term_schedule_versions v
    join gym20.student_terms t on t.id = v.term_id
   where v.id = p_version_id and v.status = 'draft'
   for update of v, t;

  if v_term_id is null then
    raise exception 'نسخه پیش‌نویس پیدا نشد یا قبلاً منتشر شده است.';
  end if;

  if exists (
    select 1
      from gym20.class_sessions cs
      join gym20.attendance a on a.session_id = cs.id
     where cs.schedule_version_id = p_version_id
  ) then
    raise exception 'برای این پیش‌نویس حضور و غیاب ثبت شده است؛ ویرایش مستقیم مجاز نیست.';
  end if;

  if jsonb_array_length(p_sessions) > (v_total * 30) then
    raise exception 'تعداد جلسات ارسالی بیش از حد مجاز است.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_sessions) as x(
      enrollment_id uuid,
      session_number integer,
      starts_at timestamptz,
      ends_at timestamptz,
      venue text,
      notes text
    )
    left join gym20.term_enrollments te
      on te.term_id = v_term_id and te.enrollment_id = x.enrollment_id
    where te.enrollment_id is null
       or x.session_number is null
       or x.session_number < 1
       or x.session_number > v_total
       or x.starts_at is null
       or x.ends_at is null
       or x.ends_at <= x.starts_at
       or extract(epoch from (x.ends_at - x.starts_at)) <> (v_duration * 60)
       or char_length(coalesce(x.venue,'')) > 250
       or char_length(coalesce(x.notes,'')) > 1000
  ) then
    raise exception 'یکی از جلسات اطلاعات نامعتبر دارد؛ سبک، شماره جلسه، زمان یا مدت را بررسی کنید.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_sessions) as x(
      enrollment_id uuid,
      session_number integer,
      starts_at timestamptz,
      ends_at timestamptz,
      venue text,
      notes text
    )
    group by x.enrollment_id, x.session_number
    having count(*) > 1
  ) then
    raise exception 'شماره جلسه تکراری برای یک سبک ثبت شده است.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_sessions) as x(
      enrollment_id uuid,
      session_number integer,
      starts_at timestamptz,
      ends_at timestamptz,
      venue text,
      notes text
    )
    group by x.enrollment_id
    having count(*) > v_total
  ) then
    raise exception 'برای یکی از سبک‌ها بیش از تعداد جلسات ترم برنامه ثبت شده است.';
  end if;

  delete from gym20.class_sessions
   where schedule_version_id = p_version_id;

  insert into gym20.class_sessions(
    course_id, enrollment_id, term_id, schedule_version_id,
    session_number, starts_at, ends_at, venue, notes, status, created_by
  )
  select e.course_id, x.enrollment_id, v_term_id, p_version_id,
         x.session_number, x.starts_at, x.ends_at,
         nullif(btrim(coalesce(x.venue,'')), ''),
         nullif(btrim(coalesce(x.notes,'')), ''),
         'scheduled', (select auth.uid())
    from jsonb_to_recordset(p_sessions) as x(
      enrollment_id uuid,
      session_number integer,
      starts_at timestamptz,
      ends_at timestamptz,
      venue text,
      notes text
    )
    join gym20.term_enrollments te
      on te.term_id = v_term_id and te.enrollment_id = x.enrollment_id
    join gym20.enrollments e on e.id = x.enrollment_id;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;

create or replace function gym20.publish_term_schedule(
  p_term_id uuid,
  p_version_id uuid
)
returns void
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_total integer;
  v_status text;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  select t.total_sessions, v.status
    into v_total, v_status
    from gym20.student_terms t
    join gym20.term_schedule_versions v on v.term_id = t.id
   where t.id = p_term_id and v.id = p_version_id
   for update of t, v;

  if v_status is null or v_status <> 'draft' then
    raise exception 'نسخه انتخاب‌شده پیش‌نویس قابل انتشار نیست.';
  end if;

  if exists (
    select 1
    from gym20.term_enrollments te
    left join lateral (
      select count(*)::integer as session_count
      from gym20.class_sessions cs
      where cs.schedule_version_id = p_version_id
        and cs.enrollment_id = te.enrollment_id
    ) x on true
    where te.term_id = p_term_id
      and x.session_count <> v_total
  ) then
    raise exception 'برای تمام سبک‌های این ترم باید دقیقاً به تعداد جلسات ترم برنامه ثبت شود.';
  end if;

  if not exists (
    select 1 from gym20.class_sessions
    where schedule_version_id = p_version_id
  ) then
    raise exception 'برنامه خالی قابل انتشار نیست.';
  end if;

  update gym20.term_schedule_versions
     set status = 'superseded'
   where term_id = p_term_id and status = 'published';

  update gym20.term_schedule_versions
     set status = 'published', published_at = now()
   where id = p_version_id;

  update gym20.student_terms
     set published_version_id = p_version_id,
         updated_at = now()
   where id = p_term_id;
end;
$function$;

create or replace function gym20.create_term_draft_from_published(p_term_id uuid)
returns uuid
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  v_published_id uuid;
  v_draft_id uuid;
  v_next_version integer;
begin
  if (select auth.uid()) is null or not (select gym20.is_active_owner()) then
    raise exception 'اجازه انجام این عملیات را ندارید.' using errcode = '42501';
  end if;

  perform 1 from gym20.student_terms where id = p_term_id for update;
  if not found then
    raise exception 'ترم پیدا نشد.';
  end if;

  select id into v_draft_id
  from gym20.term_schedule_versions
  where term_id = p_term_id and status = 'draft'
  limit 1;

  if v_draft_id is not null then
    return v_draft_id;
  end if;

  select published_version_id into v_published_id
  from gym20.student_terms where id = p_term_id;

  select coalesce(max(version_number),0)+1 into v_next_version
  from gym20.term_schedule_versions where term_id = p_term_id;

  insert into gym20.term_schedule_versions(term_id, version_number, status, created_by)
  values (p_term_id, v_next_version, 'draft', (select auth.uid()))
  returning id into v_draft_id;

  if v_published_id is not null then
    insert into gym20.class_sessions(
      course_id, enrollment_id, term_id, schedule_version_id,
      session_number, starts_at, ends_at, venue, notes, status, created_by
    )
    select course_id, enrollment_id, term_id, v_draft_id,
           session_number, starts_at, ends_at, venue, notes, 'scheduled', (select auth.uid())
    from gym20.class_sessions
    where schedule_version_id = v_published_id;
  end if;

  return v_draft_id;
end;
$function$;

revoke all on function gym20.replace_term_draft_sessions(uuid,jsonb) from public, anon;
revoke all on function gym20.publish_term_schedule(uuid,uuid) from public, anon;
revoke all on function gym20.create_term_draft_from_published(uuid) from public, anon;
grant execute on function gym20.replace_term_draft_sessions(uuid,jsonb) to authenticated;
grant execute on function gym20.publish_term_schedule(uuid,uuid) to authenticated;
grant execute on function gym20.create_term_draft_from_published(uuid) to authenticated;
