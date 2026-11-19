-- Restore GYM20 student web-push infrastructure.
begin;
create table if not exists gym20.student_push_vapid (
  id smallint primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null,
  subject text not null default 'mailto:admin@gym20.ir',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists gym20.student_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references gym20.students(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists student_push_subscriptions_student_active_idx
  on gym20.student_push_subscriptions(student_id, is_active);
create table if not exists gym20.student_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references gym20.students(id) on delete cascade,
  session_id uuid not null references gym20.class_sessions(id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('first','second','manual')),
  sent_at timestamptz not null default now(),
  unique(student_id, session_id, reminder_kind)
);
alter table gym20.student_push_vapid enable row level security;
alter table gym20.student_push_subscriptions enable row level security;
alter table gym20.student_push_deliveries enable row level security;
revoke all on gym20.student_push_vapid, gym20.student_push_subscriptions, gym20.student_push_deliveries from public, anon, authenticated;
grant all privileges on gym20.student_push_vapid, gym20.student_push_subscriptions, gym20.student_push_deliveries to service_role;
grant usage on schema gym20 to service_role;
grant all privileges on all tables in schema gym20 to service_role;
grant all privileges on all sequences in schema gym20 to service_role;
alter default privileges in schema gym20 grant all privileges on tables to service_role;
alter default privileges in schema gym20 grant all privileges on sequences to service_role;
insert into gym20.site_settings(key,value)
values ('student_push_config', jsonb_build_object(
  'enabled', true, 'reminder_1_hours', 6, 'reminder_2_hours', 2,
  'reminder_1_template', '{student} عزیز، خوبی؟ 🌱 کلاس ما {relative}، {day} ساعت {time} برگزار می‌شود. منتظرت هستم!',
  'reminder_2_template', '{student} عزیز 💪 آماده‌ای؟ کلاس شما {relative}، {day} ساعت {time} شروع می‌شود. به امید دیدار!'
)) on conflict (key) do nothing;
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'gym20_student_push_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'),
      'gym20_student_push_cron_secret',
      'Private authentication token for the GYM20 scheduled push worker', null);
  end if;
end $$;
create or replace function gym20.verify_student_push_cron_secret(p_secret text)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select coalesce(p_secret is not null and p_secret = (
    select ds.decrypted_secret from vault.decrypted_secrets ds
    where ds.name = 'gym20_student_push_cron_secret' limit 1
  ), false);
$function$;
revoke all on function gym20.verify_student_push_cron_secret(text) from public, anon, authenticated;
grant execute on function gym20.verify_student_push_cron_secret(text) to service_role;
create or replace function public.get_student_public_schedule_by_code(p_code text)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select gym20.get_student_public_schedule_by_code(p_code); $$;
create or replace function public.get_student_exercises_by_code(p_code text)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select gym20.get_student_exercises_by_code(p_code); $$;
create or replace function public.set_student_exercise_completion(p_code text,p_exercise_id uuid,p_completed boolean)
returns boolean language sql security invoker set search_path = ''
as $$ select gym20.set_student_exercise_completion(p_code,p_exercise_id,p_completed); $$;
revoke all on function public.get_student_public_schedule_by_code(text) from public;
revoke all on function public.get_student_exercises_by_code(text) from public;
revoke all on function public.set_student_exercise_completion(text,uuid,boolean) from public;
grant execute on function public.get_student_public_schedule_by_code(text) to anon, authenticated;
grant execute on function public.get_student_exercises_by_code(text) to anon, authenticated;
grant execute on function public.set_student_exercise_completion(text,uuid,boolean) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
