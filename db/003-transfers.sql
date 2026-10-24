-- Run once in the Supabase SQL editor. Safe to run more than once.
-- A transfer between two wallets is stored as two linked transactions (a withdrawal from one
-- wallet and a deposit into the other) that share the same transfer_id.
alter table public.transactions add column if not exists transfer_id uuid;
create index if not exists transactions_transfer_idx on public.transactions (transfer_id) where transfer_id is not null;

notify pgrst, 'reload schema';
