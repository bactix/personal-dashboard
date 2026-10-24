-- Run once in the Supabase SQL editor. Safe to run more than once.
-- Lets a withdrawal be registered to a budget (optional). Budgets count exactly the withdrawals
-- registered to them. If a budget is deleted, its transactions stay and simply lose the link.
alter table public.transactions
  add column if not exists budget_id uuid references public.budgets(id) on delete set null;

create index if not exists transactions_budget_idx
  on public.transactions (budget_id) where budget_id is not null;

notify pgrst, 'reload schema';
