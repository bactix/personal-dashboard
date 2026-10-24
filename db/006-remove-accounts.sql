-- Run once in the Supabase SQL editor, AFTER the app update that removes Accounts is running.
-- Safe to run more than once.
--
-- WHAT THIS DELETES (your data right now: 1 account, 1 transaction filed under it, 0 budgets):
--   * every row of the `accounts` table, and the table itself
--   * the `account_id` column on `transactions` and on `budgets`
--     (the transactions and budgets themselves stay; they just stop pointing at an account)
--
-- It cannot be undone. If you might want the account names back, run this first and keep the result:
--   select * from public.accounts;

-- 1) Remove the links first, so nothing still points at the accounts table.
alter table public.transactions drop column if exists account_id;
alter table public.budgets      drop column if exists account_id;

-- 2) Then the table. No CASCADE on purpose: if anything unexpected still depends on it,
--    this errors out instead of silently dropping that too.
drop table if exists public.accounts;

notify pgrst, 'reload schema';
