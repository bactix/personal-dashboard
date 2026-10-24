-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Safe to run more than once. It changes the tables you already created so they hold everything
-- the features save. Nothing is dropped and no rows are touched.

-- ---------------------------------------------------------------- 1. missing columns
-- Order of rows inside a parent (phones, emails, project links, invoice lines)
alter table public.contact_phones    add column if not exists position smallint not null default 0;
alter table public.contact_emails    add column if not exists position smallint not null default 0;
alter table public.project_resources add column if not exists position smallint not null default 0;
alter table public.invoice_items     add column if not exists position smallint not null default 0;

-- Free-text fields the features save
alter table public.assets       add column if not exists notes       text;
alter table public.bills        add column if not exists notes       text;
alter table public.invoices     add column if not exists notes       text;
alter table public.debts        add column if not exists description text;
alter table public.tickets      add column if not exists description text;
alter table public.transactions add column if not exists note        text;
alter table public.budgets      add column if not exists name        text;

-- ---------------------------------------------------------------- 2. category values
-- The app's budget and task categories differ from the ones first created. This only ADDS values;
-- the old ones stay (unused). The enum type names are looked up, so no guessing.
do $$
declare
  enum_type text;
  wanted    text;
begin
  select format_type(a.atttypid, null) into enum_type
    from pg_attribute a where a.attrelid = 'public.budgets'::regclass and a.attname = 'category';
  foreach wanted in array array['groceries','dining','housing','utilities','transport','health',
                                'education','entertainment','shopping','subscriptions','travel','gifts','other'] loop
    execute format('alter type %s add value if not exists %L', enum_type, wanted);
  end loop;

  select format_type(a.atttypid, null) into enum_type
    from pg_attribute a where a.attrelid = 'public.tasks'::regclass and a.attname = 'category';
  foreach wanted in array array['learning','work','deen','thoughts'] loop
    execute format('alter type %s add value if not exists %L', enum_type, wanted);
  end loop;
end $$;

-- ---------------------------------------------------------------- 3. keep the data private
-- The browser's publishable key must not read or write anything. With Row Level Security on and
-- no policies, only the server (secret key) can. Views must respect it too.
alter table public.assets            enable row level security;
alter table public.bill_payments     enable row level security;
alter table public.bill_returns      enable row level security;
alter table public.bills             enable row level security;
alter table public.budgets           enable row level security;
alter table public.contact_emails    enable row level security;
alter table public.contact_phones    enable row level security;
alter table public.contacts          enable row level security;
alter table public.currencies        enable row level security;
alter table public.debts             enable row level security;
alter table public.goals             enable row level security;
alter table public.invoice_items     enable row level security;
alter table public.invoice_payments  enable row level security;
alter table public.invoice_returns   enable row level security;
alter table public.invoices          enable row level security;
alter table public.logos             enable row level security;
alter table public.project_resources enable row level security;
alter table public.projects          enable row level security;
alter table public.purchase_items    enable row level security;
alter table public.stash_items       enable row level security;
alter table public.tasks             enable row level security;
alter table public.tickets           enable row level security;
alter table public.timezones         enable row level security;
alter table public.transactions      enable row level security;
alter table public.wallets           enable row level security;

alter view public.wallet_balances set (security_invoker = true);
alter view public.invoice_totals  set (security_invoker = true);
alter view public.bill_totals     set (security_invoker = true);

-- Make the API pick up the new columns right away.
notify pgrst, 'reload schema';
