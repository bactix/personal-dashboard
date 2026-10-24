-- Run once in the Supabase SQL editor. Safe to run more than once.
-- Debt payments (Financial -> Debts -> Pay): each payment is a row here AND a wallet transaction
-- (money out of a wallet for a debt I owe, money in for a debt owed to me). Deleting the
-- transaction removes its payment, which gives that amount back to the debt.
create table if not exists public.debt_payments (
  id             uuid primary key default gen_random_uuid(),
  debt_id        uuid not null references public.debts(id) on delete restrict,
  transaction_id uuid not null unique references public.transactions(id) on delete cascade,
  amount_cents   bigint not null check (amount_cents > 0),
  created_at     timestamptz not null default now()
);

create index if not exists debt_payments_debt_idx on public.debt_payments (debt_id);

-- Private like every other table: only the server (secret key) can read or write it.
alter table public.debt_payments enable row level security;

notify pgrst, 'reload schema';
