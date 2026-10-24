-- Personal Dashboard — proposed relational schema (PostgreSQL 15+; gen_random_uuid() is built in).
-- Mirrors what the app stores today in data/*.json (see src/features/*/types.ts).
-- Conventions
--   * ids are uuid; every record has created_at (the app shows it as dd-mmmm-yyyy)
--   * money is bigint minor units (cents), never numeric/float
--   * calendar days (due dates, purchase date, ...) are `date`; moments are timestamptz
--   * single owner: no users table (add `owner_id` to every table if this ever becomes multi-user)
--   * ON DELETE RESTRICT where the app refuses to delete a referenced record today
--     (InUseError); CASCADE for parts that only exist inside their parent.


-- ---------------------------------------------------------------- enums
CREATE TYPE currency_code    AS ENUM ('USD', 'LBP', 'EUR', 'CAD', 'AUD', 'AED', 'SAR');  -- lib/money.ts CURRENCIES
CREATE TYPE debt_direction   AS ENUM ('i-owe', 'owed-to-me');
CREATE TYPE txn_type         AS ENUM ('deposit', 'withdrawal');
CREATE TYPE budget_category  AS ENUM ('groceries','dining','housing','utilities','transport','health',
                                      'education','entertainment','shopping','subscriptions','travel',
                                      'gifts','other');
CREATE TYPE task_category    AS ENUM ('learning', 'work', 'deen', 'thoughts');
CREATE TYPE invoice_status   AS ENUM ('draft', 'sent', 'paid');
CREATE TYPE bill_status      AS ENUM ('unpaid', 'paid');
CREATE TYPE ticket_status    AS ENUM ('open', 'in-progress', 'resolved');
CREATE TYPE ticket_priority  AS ENUM ('low', 'medium', 'high');
CREATE TYPE stash_status     AS ENUM ('pending', 'in-progress', 'done');

-- ============================================================ SETTINGS
-- Settings -> General -> Currencies  (seeded with USD, LBP)
CREATE TABLE currencies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       char(3) NOT NULL UNIQUE CHECK (code = upper(code)),   -- ISO 4217
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Settings -> General -> Time zones  (header clock, Home clock, Time machine page)
CREATE TABLE timezones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city       text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 60),
  time_zone  text NOT NULL,                                          -- IANA, e.g. 'Europe/Paris'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Settings -> Personal -> Logos  (stored as bytes instead of today's base64 data URL)
CREATE TABLE logos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  mime_type  text NOT NULL CHECK (mime_type IN ('image/png','image/jpeg','image/webp','image/gif','image/svg+xml')),
  image      bytea NOT NULL CHECK (octet_length(image) <= 1048576),  -- 1 MB, as in the UI
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================ PERSONAL
CREATE TABLE contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Several numbers / emails per contact (<= 10 each, enforced by the app).
-- Numbers are stored with their country code, e.g. '+961 3 395 854' (lib/phone.ts).
CREATE TABLE contact_phones (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  phone      text NOT NULL CHECK (char_length(phone) <= 40),
  position   smallint NOT NULL DEFAULT 0,
  UNIQUE (contact_id, phone)
);
CREATE TABLE contact_emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email      text NOT NULL CHECK (char_length(email) <= 120),
  position   smallint NOT NULL DEFAULT 0,
  UNIQUE (contact_id, email)
);

-- Personal -> Purchase ("to buy" list)
CREATE TABLE purchase_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  url        text CHECK (url ~* '^https?://'),
  note       text CHECK (char_length(note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Personal -> Stash
CREATE TABLE stash_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),  -- a link or free text
  status     stash_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================ WORK
CREATE TABLE projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  start_date date,                                   -- defaults to the creation day in the app
  end_date   date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

-- A project's resource links (<= 20, enforced by the app)
CREATE TABLE project_resources (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      text CHECK (char_length(title) <= 80),
  url        text NOT NULL CHECK (url ~* '^https?://' AND char_length(url) <= 500),
  position   smallint NOT NULL DEFAULT 0
);

CREATE TABLE tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
  description text CHECK (char_length(description) <= 2000),
  start_date  date,
  end_date    date,
  project_id  uuid REFERENCES projects(id) ON DELETE RESTRICT,   -- "project has tasks" blocks deletion
  category    task_category,                                     -- only for tasks without a project
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
  CHECK (project_id IS NULL OR category IS NULL)
);

-- Work -> Help desk
CREATE TABLE tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text CHECK (char_length(description) <= 1000),
  requester   text CHECK (char_length(requester) <= 80),          -- free text
  priority    ticket_priority NOT NULL,
  status      ticket_status   NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================ FINANCIAL
CREATE TABLE debts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction    debt_direction NOT NULL,
  contact_id   uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,  -- "contact has debts"
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency     currency_code NOT NULL,
  description  text CHECK (char_length(description) <= 200),
  due_date     date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  currency   currency_code NOT NULL,   -- locked once the wallet has transactions (app rule)
  amount     numeric(18,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),  -- starting balance, whole currency units
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Monthly spending limit; withdrawals in `currency` count against it.
CREATE TABLE budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text CHECK (char_length(name) <= 60),
  category    budget_category,
  currency    currency_code NOT NULL,
  limit_cents bigint NOT NULL CHECK (limit_cents > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    uuid NOT NULL REFERENCES wallets(id)  ON DELETE RESTRICT,  -- "wallet has transactions"
  type         txn_type NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),                  -- type decides the sign
  note         text CHECK (char_length(note) <= 200),
  budget_id    uuid REFERENCES budgets(id) ON DELETE SET NULL,   -- optional: the budget a withdrawal counts against
  txn_date     date NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_wallet_idx  ON transactions (wallet_id, txn_date DESC);

-- Money paid toward a debt. Each payment is also a wallet transaction (db/009-debt-payments.sql);
-- deleting that transaction removes the payment.
CREATE TABLE debt_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id        uuid NOT NULL REFERENCES debts(id) ON DELETE RESTRICT,
  transaction_id uuid NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  amount_cents   bigint NOT NULL CHECK (amount_cents > 0),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX debt_payments_debt_idx ON debt_payments (debt_id);

-- A savings goal owns a wallet (created together); name + currency come from that wallet.
CREATE TABLE goals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    uuid NOT NULL UNIQUE REFERENCES wallets(id) ON DELETE RESTRICT,
  target_cents bigint NOT NULL CHECK (target_cents > 0),
  target_date  date,
  created_at   timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE assets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  category            text CHECK (char_length(category) <= 40),            -- free text
  currency            currency_code NOT NULL,
  purchase_date       date NOT NULL,
  purchase_cents      bigint NOT NULL CHECK (purchase_cents > 0),
  current_value_cents bigint NOT NULL CHECK (current_value_cents >= 0),
  notes               text CHECK (char_length(notes) <= 500),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Financial -> Subscriptions. The next renewal is worked out from start_date + cycle, never stored.
CREATE TABLE subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency     currency_code NOT NULL,
  cycle        text NOT NULL CHECK (cycle IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date   date NOT NULL,                                         -- first charge
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  notes        text CHECK (char_length(notes) <= 500),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------- invoices (money owed to you)
CREATE SEQUENCE invoice_number_seq;                                       -- INV-0001, INV-0002, ...
CREATE TABLE invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number         text NOT NULL UNIQUE DEFAULT 'INV-' || lpad(nextval('invoice_number_seq')::text, 4, '0'),
  customer       text NOT NULL CHECK (char_length(customer) BETWEEN 1 AND 80),  -- name picked from contacts, kept as text
  currency       currency_code NOT NULL,
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  issue_date     date NOT NULL,
  due_date       date NOT NULL,
  status         invoice_status NOT NULL DEFAULT 'draft',
  notes          text CHECK (char_length(notes) <= 500),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (due_date >= issue_date)
);
CREATE TABLE invoice_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 120),
  quantity    integer NOT NULL CHECK (quantity > 0),
  unit_cents  bigint  NOT NULL CHECK (unit_cents > 0),
  position    smallint NOT NULL DEFAULT 0
);
CREATE TABLE invoice_returns (         -- credit notes
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  return_date  date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  reason       text CHECK (char_length(reason) <= 200)
);
CREATE TABLE invoice_payments (        -- money received
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  paid_date    date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  note         text CHECK (char_length(note) <= 200)
);

-- ---------------------------------------------------------- vendor bills (money you owe)
CREATE TABLE bills (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor         text NOT NULL CHECK (char_length(vendor) BETWEEN 1 AND 80),
  reference      text CHECK (char_length(reference) <= 60),               -- the vendor's own number
  currency       currency_code NOT NULL,
  amount_cents   bigint NOT NULL CHECK (amount_cents > 0),
  discount_cents bigint NOT NULL DEFAULT 0 CHECK (discount_cents >= 0 AND discount_cents < amount_cents),
  bill_date      date NOT NULL,
  due_date       date NOT NULL,
  status         bill_status NOT NULL DEFAULT 'unpaid',
  notes          text CHECK (char_length(notes) <= 500),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (due_date >= bill_date)
);
CREATE TABLE bill_returns (            -- refunds from the vendor
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id      uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  return_date  date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  reason       text CHECK (char_length(reason) <= 200)
);
CREATE TABLE bill_payments (           -- money paid out
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id      uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  paid_date    date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  note         text CHECK (char_length(note) <= 200)
);

-- ============================================================ DERIVED VIEWS
-- Nothing below is stored: the app derives these today and the DB should too.

-- Wallet balance = starting balance + deposits - withdrawals (must never go negative: enforce in the
-- service layer, or with a deferred constraint trigger on transactions).
CREATE VIEW wallet_balances AS
SELECT w.id AS wallet_id, w.name, w.currency,
       round(w.amount * 100)::bigint
         + COALESCE(SUM(CASE t.type WHEN 'deposit' THEN t.amount_cents ELSE -t.amount_cents END), 0)::bigint AS balance_cents
FROM wallets w LEFT JOIN transactions t ON t.wallet_id = w.id
GROUP BY w.id;

-- total = subtotal - discount; net = total - returns; outstanding = net - payments.
-- Rule (app + a constraint trigger): returns + payments <= total.
CREATE VIEW invoice_totals AS
SELECT i.id AS invoice_id, i.number, i.currency,
       COALESCE(it.subtotal, 0) - i.discount_cents                                 AS total_cents,
       COALESCE(r.returned, 0)                                                     AS returned_cents,
       COALESCE(p.paid, 0)                                                         AS paid_cents,
       COALESCE(it.subtotal, 0) - i.discount_cents - COALESCE(r.returned, 0) - COALESCE(p.paid, 0) AS outstanding_cents
FROM invoices i
LEFT JOIN (SELECT invoice_id, SUM(quantity * unit_cents) AS subtotal FROM invoice_items    GROUP BY 1) it ON it.invoice_id = i.id
LEFT JOIN (SELECT invoice_id, SUM(amount_cents)          AS returned FROM invoice_returns  GROUP BY 1) r  ON r.invoice_id  = i.id
LEFT JOIN (SELECT invoice_id, SUM(amount_cents)          AS paid     FROM invoice_payments GROUP BY 1) p  ON p.invoice_id  = i.id;

CREATE VIEW bill_totals AS
SELECT b.id AS bill_id, b.vendor, b.currency,
       b.amount_cents - b.discount_cents                                           AS total_cents,
       COALESCE(r.returned, 0)                                                     AS returned_cents,
       COALESCE(p.paid, 0)                                                         AS paid_cents,
       b.amount_cents - b.discount_cents - COALESCE(r.returned, 0) - COALESCE(p.paid, 0) AS outstanding_cents
FROM bills b
LEFT JOIN (SELECT bill_id, SUM(amount_cents) AS returned FROM bill_returns  GROUP BY 1) r ON r.bill_id = b.id
LEFT JOIN (SELECT bill_id, SUM(amount_cents) AS paid     FROM bill_payments GROUP BY 1) p ON p.bill_id = b.id;

-- ============================================================ NOT IN THE DATABASE
-- * Azkar texts            static content in src/features/azkar/data.ts (progress stays in the browser)
-- * Prayer times, weather, gold/silver prices   fetched live from external APIs (optionally cache them)
-- * Notifications         derived on the fly from invoices, bills, tasks, projects, prayer times
-- * Notification dismissals, selected header clock, azkar counters   per-browser localStorage
-- * Login                 Supabase Auth (auth.users, managed by Supabase); one owner, AUTH_OWNER_EMAIL in .env.local
