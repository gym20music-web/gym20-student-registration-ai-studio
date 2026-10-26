-- GYM20 public registration requests
-- Run this file in Supabase SQL Editor to update the public registration flow.
-- This does not expose student or management tables to anonymous users.

create table if not exists gym20.public_registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9+]', '', 'g')) between 8 and 16),
  birth_date date,
  notes text check (notes is null or char_length(notes) <= 1000),
  course_id uuid references gym20.courses(id) on delete restrict,
  selected_styles text[] not null default '{}',
  age_group text not null default 'adult' check (age_group in ('adult', 'kids')),
  class_type text not null check (class_type in ('normal', 'semi', 'private', 'vip')),
  total_sessions integer not null check (total_sessions in (8, 10, 12)),
  package_type text not null default 'sessions' check (package_type = 'sessions'),
  payment_confirmed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Safely migrate an existing table created by the previous registration version.
alter table gym20.public_registration_requests
  alter column course_id drop not null;

alter table gym20.public_registration_requests
  add column if not exists selected_styles text[] not null default '{}',
  add column if not exists age_group text not null default 'adult',
  add column if not exists payment_confirmed boolean not null default false;

alter table gym20.public_registration_requests enable row level security;
revoke all on table gym20.public_registration_requests from anon, authenticated;
grant usage on schema gym20 to anon;

create or replace function gym20.public_registration_courses()
returns table (id uuid, name text, description text, class_type text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.name, c.description, c.class_type
  from gym20.courses as c
  where c.is_active = true
  order by c.name;
$$;

-- Remove the old function signature that required a course_id.
drop function if exists gym20.submit_public_registration(text, text, date, text, uuid, text, integer);

create or replace function gym20.submit_public_registration(
  p_full_name text,
  p_phone text,
  p_birth_date date,
  p_notes text,
  p_selected_styles text[],
  p_age_group text,
  p_class_type text,
  p_total_sessions integer,
  p_payment_confirmed boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_styles text[];
begin
  if p_full_name is null or char_length(btrim(p_full_name)) < 2
     or char_length(btrim(p_full_name)) > 120 then
    raise exception 'نام و نام خانوادگی معتبر وارد کنید.';
  end if;

  if p_phone is null
     or char_length(regexp_replace(p_phone, '[^0-9+]', '', 'g')) < 8
     or char_length(regexp_replace(p_phone, '[^0-9+]', '', 'g')) > 16 then
    raise exception 'شماره تلفن معتبر وارد کنید.';
  end if;

  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'توضیحات بیش از حد طولانی است.';
  end if;

  if p_birth_date is not null and (p_birth_date > current_date or p_birth_date < date '1900-01-01') then
    raise exception 'تاریخ تولد معتبر نیست.';
  end if;

  if p_selected_styles is null
     or cardinality(p_selected_styles) < 1
     or cardinality(p_selected_styles) > 20 then
    raise exception 'حداقل یک سبک معتبر انتخاب کنید.';
  end if;

  if exists (
    select 1
    from unnest(p_selected_styles) as t(style_name)
    where style_name is null
       or char_length(btrim(style_name)) < 1
       or char_length(btrim(style_name)) > 80
  ) then
    raise exception 'نام یکی از سبک‌های انتخاب‌شده معتبر نیست.';
  end if;

  if p_age_group is null or p_age_group not in ('adult', 'kids') then
    raise exception 'رده سنی معتبر نیست.';
  end if;

  if p_class_type is null or p_class_type not in ('normal', 'semi', 'private', 'vip') then
    raise exception 'نوع کلاس معتبر نیست.';
  end if;

  if p_total_sessions is null or p_total_sessions not in (8, 10, 12) then
    raise exception 'تعداد جلسات معتبر نیست.';
  end if;

  if p_payment_confirmed is distinct from true then
    raise exception 'ابتدا پرداخت شهریه را تأیید کنید.';
  end if;

  select array_agg(btrim(style_name) order by ord)
    into v_styles
  from unnest(p_selected_styles) with ordinality as t(style_name, ord);

  insert into gym20.public_registration_requests
    (full_name, phone, birth_date, notes, course_id, selected_styles, age_group,
     class_type, total_sessions, package_type, payment_confirmed)
  values
    (btrim(p_full_name),
     regexp_replace(btrim(p_phone), '[[:space:]]+', '', 'g'),
     p_birth_date,
     nullif(btrim(coalesce(p_notes, '')), ''),
     null,
     v_styles,
     p_age_group,
     p_class_type,
     p_total_sessions,
     'sessions',
     true)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function gym20.public_registration_courses() from public;
revoke all on function gym20.submit_public_registration(text, text, date, text, text[], text, text, integer, boolean) from public;
grant execute on function gym20.public_registration_courses() to anon;
grant execute on function gym20.submit_public_registration(text, text, date, text, text[], text, text, integer, boolean) to anon;

notify pgrst, 'reload schema';
