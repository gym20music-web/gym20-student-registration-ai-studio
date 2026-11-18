-- GYM20 additive finance ledger for the rebuilt admin panel.
-- Run only after reviewing this migration and confirming the production Supabase project.
begin;

create table if not exists gym20.student_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references gym20.students(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('payment','refund')),
  amount_toman bigint not null check (amount_toman > 0),
  payment_method text not null default 'card' check (payment_method in ('card','cash','online','other')),
  paid_at date not null default current_date,
  reference text check (reference is null or char_length(reference) <= 120),
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid references gym20.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists student_payments_student_paid_at_idx
  on gym20.student_payments(student_id, paid_at desc);
create index if not exists student_payments_paid_at_idx
  on gym20.student_payments(paid_at desc);

alter table gym20.student_payments enable row level security;
drop policy if exists student_payments_owner_all on gym20.student_payments;
create policy student_payments_owner_all
  on gym20.student_payments
  for all to authenticated
  using ((select gym20.is_active_owner()))
  with check ((select gym20.is_active_owner()));

grant select, insert, update, delete on gym20.student_payments to authenticated;
revoke all on gym20.student_payments from anon;

notify pgrst, 'reload schema';
commit;