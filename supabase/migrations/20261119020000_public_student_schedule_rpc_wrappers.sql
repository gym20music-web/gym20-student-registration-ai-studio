-- Public-schema wrappers keep the student page working when gym20 is not
-- included in Supabase's Exposed schemas. Each underlying function validates
-- the opaque public link code and scopes access to that student.
begin;

create or replace function public.get_student_public_schedule_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = ''
as $$ select gym20.get_student_public_schedule_by_code(p_code); $$;

create or replace function public.get_student_exercises_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = ''
as $$ select gym20.get_student_exercises_by_code(p_code); $$;

create or replace function public.set_student_exercise_completion(
  p_code text, p_exercise_id uuid, p_completed boolean
)
returns boolean language sql security definer set search_path = ''
as $$ select gym20.set_student_exercise_completion(p_code, p_exercise_id, p_completed); $$;

revoke all on function public.get_student_public_schedule_by_code(text) from public;
revoke all on function public.get_student_exercises_by_code(text) from public;
revoke all on function public.set_student_exercise_completion(text,uuid,boolean) from public;
grant execute on function public.get_student_public_schedule_by_code(text) to anon, authenticated;
grant execute on function public.get_student_exercises_by_code(text) to anon, authenticated;
grant execute on function public.set_student_exercise_completion(text,uuid,boolean) to anon, authenticated;

notify pgrst, 'reload schema';
commit;