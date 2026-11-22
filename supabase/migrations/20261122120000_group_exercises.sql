-- Shared group exercise plans. Public student access is scoped to the
-- student's existing opaque public link code and group membership.
begin;

create table if not exists gym20.exercise_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_by uuid not null references gym20.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists gym20.exercise_group_members (
  group_id uuid not null references gym20.exercise_groups(id) on delete cascade,
  student_id uuid not null references gym20.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, student_id)
);
create table if not exists gym20.group_exercises (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references gym20.exercise_groups(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now()
);
create table if not exists gym20.group_exercise_completions (
  exercise_id uuid not null references gym20.group_exercises(id) on delete cascade,
  student_id uuid not null references gym20.students(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (exercise_id, student_id)
);
create table if not exists gym20.admin_group_exercise_push_deliveries (
  exercise_id uuid not null references gym20.group_exercises(id) on delete cascade,
  student_id uuid not null references gym20.students(id) on delete cascade,
  completed_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (exercise_id, student_id, completed_at)
);

create index if not exists exercise_group_members_student_idx
  on gym20.exercise_group_members(student_id, group_id);
create index if not exists group_exercises_group_created_idx
  on gym20.group_exercises(group_id, created_at desc);
create index if not exists group_exercise_completions_student_idx
  on gym20.group_exercise_completions(student_id, exercise_id);

alter table gym20.exercise_groups enable row level security;
alter table gym20.exercise_group_members enable row level security;
alter table gym20.group_exercises enable row level security;
alter table gym20.group_exercise_completions enable row level security;
alter table gym20.admin_group_exercise_push_deliveries enable row level security;

revoke all on gym20.exercise_groups, gym20.exercise_group_members,
  gym20.group_exercises, gym20.group_exercise_completions,
  gym20.admin_group_exercise_push_deliveries from public, anon;
grant select, insert, update, delete on gym20.exercise_groups,
  gym20.exercise_group_members, gym20.group_exercises,
  gym20.group_exercise_completions to authenticated;
revoke all on gym20.admin_group_exercise_push_deliveries from public, anon, authenticated;
grant all on gym20.admin_group_exercise_push_deliveries to service_role;

drop policy if exists exercise_groups_owner_all on gym20.exercise_groups;
create policy exercise_groups_owner_all on gym20.exercise_groups
  for all to authenticated using ((select gym20.is_active_owner()))
  with check ((select gym20.is_active_owner()));
drop policy if exists exercise_group_members_owner_all on gym20.exercise_group_members;
create policy exercise_group_members_owner_all on gym20.exercise_group_members
  for all to authenticated using ((select gym20.is_active_owner()))
  with check ((select gym20.is_active_owner()));
drop policy if exists group_exercises_owner_all on gym20.group_exercises;
create policy group_exercises_owner_all on gym20.group_exercises
  for all to authenticated using ((select gym20.is_active_owner()))
  with check ((select gym20.is_active_owner()));
drop policy if exists group_exercise_completions_owner_select on gym20.group_exercise_completions;
create policy group_exercise_completions_owner_select on gym20.group_exercise_completions
  for select to authenticated using ((select gym20.is_active_owner()));
drop policy if exists admin_group_exercise_push_service_only on gym20.admin_group_exercise_push_deliveries;
create policy admin_group_exercise_push_service_only on gym20.admin_group_exercise_push_deliveries
  for all to service_role using (true) with check (true);

-- Extend the existing single round-trip exercise feed with group assignments.
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
        'id',ge.id,'term_id',null,'title',ge.title,
        'is_completed',exists(select 1 from gym20.group_exercise_completions c
          where c.exercise_id=ge.id and c.student_id=(select student_id from target)),
        'completed_at',(select c.completed_at from gym20.group_exercise_completions c
          where c.exercise_id=ge.id and c.student_id=(select student_id from target)),
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
    join gym20.exercise_group_members mine on mine.group_id=g.id
      and mine.student_id=(select student_id from target)
  )
  select coalesce(jsonb_agg(item order by sort_at),'[]'::jsonb) from feed;
$function$;

create or replace function gym20.set_student_group_exercise_completion(
  p_code text,p_exercise_id uuid,p_completed boolean
) returns boolean language plpgsql security definer set search_path = ''
as $function$
declare v_student_id uuid; v_group_id uuid; v_rows integer;
begin
  if p_code is null or p_code !~ '^[0-9a-f]{12}$' then return false; end if;
  select l.student_id into v_student_id from gym20.student_public_links l
    where l.code=lower(p_code) limit 1;
  if v_student_id is null then return false; end if;
  select ge.group_id into v_group_id from gym20.group_exercises ge where ge.id=p_exercise_id;
  if v_group_id is null or not exists(
    select 1 from gym20.exercise_group_members gm
    where gm.group_id=v_group_id and gm.student_id=v_student_id
  ) then return false; end if;
  if coalesce(p_completed,false) then
    insert into gym20.group_exercise_completions(exercise_id,student_id,completed_at)
    values(p_exercise_id,v_student_id,now())
    on conflict(exercise_id,student_id) do update set completed_at=excluded.completed_at;
  else
    delete from gym20.group_exercise_completions
      where exercise_id=p_exercise_id and student_id=v_student_id;
  end if;
  return true;
end;
$function$;

revoke all on function gym20.get_student_exercises_by_code(text) from public;
revoke all on function gym20.set_student_group_exercise_completion(text,uuid,boolean) from public;
grant execute on function gym20.get_student_exercises_by_code(text) to anon, authenticated;
grant execute on function gym20.set_student_group_exercise_completion(text,uuid,boolean) to anon, authenticated;

create or replace function public.set_student_group_exercise_completion(
  p_code text,p_exercise_id uuid,p_completed boolean
) returns boolean language sql security invoker set search_path = ''
as $function$ select gym20.set_student_group_exercise_completion(p_code,p_exercise_id,p_completed); $function$;
revoke all on function public.set_student_group_exercise_completion(text,uuid,boolean) from public;
grant execute on function public.set_student_group_exercise_completion(text,uuid,boolean) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
