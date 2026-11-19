-- Public student schedule and exercise RPCs for the recovered GYM20 project.
-- Access is scoped strictly to the opaque 12-character public link code.
begin;

create or replace function gym20.get_student_public_schedule_by_code(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  with target as (
    select l.student_id, s.full_name
    from gym20.student_public_links l
    join gym20.students s on s.id = l.student_id
    where l.code = p_code
      and p_code ~ '^[0-9a-f]{12}$'
    limit 1
  ),
  term_rows as (
    select
      t.id,
      t.term_name,
      t.term_order,
      t.start_date,
      t.end_date,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', cs.id,
            'session_number', cs.session_number,
            'starts_at', cs.starts_at,
            'ends_at', cs.ends_at,
            'coach_name', cs.coach_name,
            'venue', cs.venue,
            'notes', cs.notes,
            'attendance', coalesce(a.status, 'pending')
          ) order by cs.starts_at, cs.session_number
        )
        from gym20.class_sessions cs
        left join lateral (
          select at.status
          from gym20.attendance at
          where at.session_id = cs.id
            and at.student_id = (select student_id from target)
          order by at.created_at desc
          limit 1
        ) a on true
        where cs.schedule_version_id = t.published_version_id
      ), '[]'::jsonb) as sessions
    from gym20.student_terms t
    join gym20.term_schedule_versions v
      on v.id = t.published_version_id
     and v.term_id = t.id
     and v.status = 'published'
    where t.student_id = (select student_id from target)
  )
  select case when exists (select 1 from target) then
    jsonb_build_object(
      'student', (select jsonb_build_object('full_name', full_name) from target),
      'terms', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'term_name', term_name,
            'term_order', term_order,
            'start_date', start_date,
            'end_date', end_date,
            'sessions', sessions
          ) order by term_order nulls last, start_date desc nulls last
        )
        from term_rows
      ), '[]'::jsonb)
    )
  else null end;
$function$;

create or replace function gym20.get_student_exercises_by_code(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'is_completed', e.is_completed,
      'completed_at', e.completed_at,
      'created_at', e.created_at
    ) order by e.created_at
  ), '[]'::jsonb)
  from gym20.student_exercises e
  join gym20.student_public_links l on l.student_id = e.student_id
  where l.code = p_code
    and p_code ~ '^[0-9a-f]{12}$';
$function$;

create or replace function gym20.set_student_exercise_completion(
  p_code text,
  p_exercise_id uuid,
  p_completed boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_student_id uuid;
  v_rows integer;
begin
  if p_code is null or p_code !~ '^[0-9a-f]{12}$' then
    return false;
  end if;

  select l.student_id into v_student_id
  from gym20.student_public_links l
  where l.code = p_code
  limit 1;

  if v_student_id is null then
    return false;
  end if;

  update gym20.student_exercises
  set is_completed = coalesce(p_completed, false),
      completed_at = case when coalesce(p_completed, false) then now() else null end
  where id = p_exercise_id
    and student_id = v_student_id;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$function$;

revoke all on function gym20.get_student_public_schedule_by_code(text) from public;
revoke all on function gym20.get_student_exercises_by_code(text) from public;
revoke all on function gym20.set_student_exercise_completion(text,uuid,boolean) from public;
grant execute on function gym20.get_student_public_schedule_by_code(text) to anon, authenticated;
grant execute on function gym20.get_student_exercises_by_code(text) to anon, authenticated;
grant execute on function gym20.set_student_exercise_completion(text,uuid,boolean) to anon, authenticated;

notify pgrst, 'reload schema';
commit;