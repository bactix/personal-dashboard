-- Run once in the Supabase SQL editor. Safe to run more than once.
-- Creates the table for the Subscriptions feature (Financial -> Subscriptions).
--
-- The `currency` column reuses the currency type your other tables already use (looked up from
-- wallets.currency), so there is nothing to guess. Cycle and status are plain text with a CHECK.
do $$
declare
  currency_type text;
begin
  select format_type(a.atttypid, null) into currency_type
    from pg_attribute a where a.attrelid = 'public.wallets'::regclass and a.attname = 'currency';

  execute format($sql$
    create table if not exists public.subscriptions (
      id           uuid primary key default gen_random_uuid(),
      name         text not null check (char_length(name) between 1 and 80),
      amount_cents bigint not null check (amount_cents > 0),
      currency     %s not null,
      cycle        text not null check (cycle in ('weekly', 'monthly', 'quarterly', 'yearly')),
      start_date   date not null,
      status       text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
      notes        text check (char_length(notes) <= 500),
      created_at   timestamptz not null default now()
    )
  $sql$, currency_type);
end $$;

-- Private like every other table: only the server (secret key) can read or write it.
alter table public.subscriptions enable row level security;

notify pgrst, 'reload schema';
