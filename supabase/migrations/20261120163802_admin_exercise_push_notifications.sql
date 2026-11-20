-- Separate, owner-only push endpoints for completed student exercises.
begin;
create table if not exists gym20.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references gym20.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists admin_push_subscriptions_owner_active_idx
  on gym20.admin_push_subscriptions(owner_id, is_active);
create table if not exists gym20.admin_exercise_push_deliveries (
  exercise_id uuid not null references gym20.student_exercises(id) on delete cascade,
  completed_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (exercise_id, completed_at)
);
alter table gym20.admin_push_subscriptions enable row level security;
alter table gym20.admin_exercise_push_deliveries enable row level security;
revoke all on gym20.admin_push_subscriptions, gym20.admin_exercise_push_deliveries from public, anon, authenticated;
grant all privileges on gym20.admin_push_subscriptions, gym20.admin_exercise_push_deliveries to service_role;
grant usage on schema gym20 to service_role;
drop policy if exists admin_push_service_only on gym20.admin_push_subscriptions;
create policy admin_push_service_only on gym20.admin_push_subscriptions
  for all to service_role using (true) with check (true);
drop policy if exists admin_exercise_push_service_only on gym20.admin_exercise_push_deliveries;
create policy admin_exercise_push_service_only on gym20.admin_exercise_push_deliveries
  for all to service_role using (true) with check (true);
commit;