-- Run once in the Supabase SQL editor. Safe to run more than once.
-- The app now supports USD, LBP, EUR, CAD, AUD, AED and SAR (src/lib/money.ts). Your database's
-- currency list already has EUR, AED and SAR; this adds Canadian dollar (CAD) and Australian dollar (AUD).
-- It only ADDS values: nothing is changed or removed, so existing wallets, debts, etc. are untouched.
-- The enum type name is looked up from wallets.currency, so there is no guessing.
do $$
declare
  currency_type text;
  wanted        text;
begin
  select format_type(a.atttypid, null) into currency_type
    from pg_attribute a where a.attrelid = 'public.wallets'::regclass and a.attname = 'currency';
  foreach wanted in array array['USD', 'LBP', 'EUR', 'CAD', 'AUD', 'AED', 'SAR'] loop
    execute format('alter type %s add value if not exists %L', currency_type, wanted);
  end loop;
end $$;

notify pgrst, 'reload schema';
