-- Optional. Run in the Supabase SQL editor. The app calculates balances itself, so nothing breaks
-- if you skip this; it only keeps the wallet_balances view in step with the new starting balance
-- (wallets.amount): balance = starting balance + deposits - withdrawals.
create or replace view public.wallet_balances
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.name,
  w.currency,
  (round(w.amount * 100)::bigint
    + coalesce(sum(case t.type when 'deposit' then t.amount_cents else -t.amount_cents end), 0))::bigint as balance_cents
from public.wallets w
left join public.transactions t on t.wallet_id = w.id
group by w.id;
