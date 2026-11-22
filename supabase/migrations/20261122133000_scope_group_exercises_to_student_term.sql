-- Scope each group exercise to the member's term whose date range contains
-- the exercise creation date (Tehran local date). This lets group members have
-- different student_terms IDs while still seeing the task in their own term.
begin;

create or replace function gym20.get_student_exercises_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = ''
as $function$
  with target as (
    select l.student_id
    from gym20.student_public_links l
    where l.code = lower(p_code) and p_code ~ '^[0-9a-f]{12}$'
    limit 1
  ), feed as (
    select e.created_at as sort_at,
      jsonb_build_object(
        'id',e.id,'term_id',e.term_id,'title',e.title,
        'is_completed',e.is_completed,'completed_at',e.completed_at,
        'created_at',e.created_at,'kind','individual'
      ) as item
    from gym20.student_exercises e
    where e.student_id = (select student_id from target)

    union all

    select ge.created_at as sort_at,
      jsonb_build_object(
        'id',ge.id,'term_id',assigned_term.id,'title',ge.title,
        'is_completed',exists(
          select 1 from gym20.group_exercise_completions c
          where c.exercise_id=ge.id and c.student_id=(select student_id from target)
        ),
        'completed_at',(
          select c.completed_at from gym20.group_exercise_completions c
          where c.exercise_id=ge.id and c.student_id=(select student_id from target)
        ),
        'created_at',ge.created_at,'kind','group',
        'group_id',g.id,'group_name',g.name,
        'members',coalesce((
          select jsonb_agg(jsonb_build_object(
            'student_id',s.id,'full_name',s.full_name,
            'is_self',s.id=(select student_id from target),
            'is_completed',c.completed_at is not null,
            'completed_at',c.completed_at
          ) order by s.full_name)
          from gym20.exercise_group_members gm
          join gym20.students s on s.id=gm.student_id
          left join gym20.group_exercise_completions c
            on c.exercise_id=ge.id and c.student_id=gm.student_id
          where gm.group_id=g.id
        ),'[]'::jsonb)
      ) as item
    from gym20.group_exercises ge
    join gym20.exercise_groups g on g.id=ge.group_id
    join gym20.exercise_group_members mine
      on mine.group_id=g.id and mine.student_id=(select student_id from target)
    left join lateral (
      select st.id
      from gym20.student_terms st
      where st.student_id=mine.student_id
        and (st.start_date is null or (ge.created_at at time zone 'Asia/Tehran')::date >= st.start_date)
        and (st.end_date is null or (ge.created_at at time zone 'Asia/Tehran')::date <= st.end_date)
      order by (st.status='active') desc, st.created_at desc
      limit 1
    ) assigned_term on true
  )
  select coalesce(jsonb_agg(item order by sort_at),'[]'::jsonb) from feed;
$function$;

revoke all on function gym20.get_student_exercises_by_code(text) from public;
grant execute on function gym20.get_student_exercises_by_code(text) to anon, authenticated;

create or replace function public.get_student_exercises_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = ''
as $function$ select gym20.get_student_exercises_by_code(p_code); $function$;

revoke all on function public.get_student_exercises_by_code(text) from public;
grant execute on function public.get_student_exercises_by_code(text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
