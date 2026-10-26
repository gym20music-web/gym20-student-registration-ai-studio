-- GYM20 public registration requests
-- Run this file once in Supabase SQL Editor. It does not grant public access to students,
-- enrollments, payments, or other existing management tables.

create table if not exists gym20.public_registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone text not null check (char_length(regexp_replace(phone, '[^0-9+]', '', 'g')) between 8 and 16),
  birth_date date,
  notes text check (notes is null or char_length(notes) <= 1000),
  course_id uuid not null references gym20.courses(id) on delete restrict,
  class_type text not null check (class_type in ('normal', 'semi', 'private', 'vip')),
  total_sessions integer not null check (total_sessions in (8, 10, 12)),
  package_type text not null default 'sessions' check (package_type = 'sessions'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

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

create or replace function gym20.submit_public_registration(
  p_full_name text,
  p_phone text,
  p_birth_date date,
  p_notes text,
  p_course_id uuid,
  p_class_type text,
  p_total_sessions integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
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

  if p_class_type not in ('normal', 'semi', 'private', 'vip') then
    raise exception 'نوع کلاس معتبر نیست.';
  end if;

  if p_total_sessions not in (8, 10, 12) then
    raise exception 'تعداد جلسات معتبر نیست.';
  end if;

  if not exists (
    select 1 from gym20.courses c
    where c.id = p_course_id and c.is_active = true
  ) then
    raise exception 'دوره انتخاب‌شده فعال نیست. صفحه را تازه‌سازی کنید.';
  end if;

  insert into gym20.public_registration_requests
    (full_name, phone, birth_date, notes, course_id, class_type, total_sessions, package_type)
  values
    (btrim(p_full_name),
     regexp_replace(btrim(p_phone), '[[:space:]]+', '', 'g'),
     p_birth_date,
     nullif(btrim(coalesce(p_notes, '')), ''),
     p_course_id,
     p_class_type,
     p_total_sessions,
     'sessions')
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function gym20.public_registration_courses() from public;
revoke all on function gym20.submit_public_registration(text, text, date, text, uuid, text, integer) from public;
grant execute on function gym20.public_registration_courses() to anon;
grant execute on function gym20.submit_public_registration(text, text, date, text, uuid, text, integer) to anon;
