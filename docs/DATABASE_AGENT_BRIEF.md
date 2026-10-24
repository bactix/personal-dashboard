# ERD

Five diagrams cover all 27 tables (key columns only; `docs/schema.sql` has every column and constraint).
Every table also has `created_at timestamptz`. Notation: `||` exactly one, `|o` zero or one,
`o{` zero or many, `|{` one or many.

### Money: contacts, debts, wallets, transactions, goals, budgets

```mermaid
erDiagram
  contacts ||--o{ contact_phones : has
  contacts ||--o{ contact_emails : has
  contacts ||--o{ debts : "owes or is owed"
  wallets ||--o{ transactions : holds
  budgets |o--o{ transactions : "counts withdrawals of"
  wallets ||--o| goals : "is the money of"

  contacts {
    uuid id PK
    text name
    timestamptz created_at
  }
  contact_phones {
    uuid id PK
    uuid contact_id FK
    text phone
  }
  contact_emails {
    uuid id PK
    uuid contact_id FK
    text email
  }
  debts {
    uuid id PK
    uuid contact_id FK
    enum direction
    bigint amount_cents
    enum currency
    date due_date
  }
  wallets {
    uuid id PK
    text name
    enum currency
  }
  transactions {
    uuid id PK
    uuid wallet_id FK
    uuid budget_id FK
    enum type
    bigint amount_cents
    date txn_date
  }
  goals {
    uuid id PK
    uuid wallet_id FK
    bigint target_cents
    date target_date
  }
  budgets {
    uuid id PK
    enum category
    enum currency
    bigint limit_cents
  }
```

Balances are never stored: a wallet's balance is its deposits minus its withdrawals (view
`wallet_balances`). A goal owns a wallet; its name and currency come from that wallet.
`RESTRICT`: a contact with debts, a wallet with transactions or a goal cannot be deleted. `CASCADE`: deleting a contact removes its phones and emails.

### Invoices: money owed to you

```mermaid
erDiagram
  invoices ||--|{ invoice_items : lists
  invoices ||--o{ invoice_returns : "credited by"
  invoices ||--o{ invoice_payments : "paid by"

  invoices {
    uuid id PK
    text number "INV-0001"
    text customer
    enum currency
    bigint discount_cents
    date issue_date
    date due_date
    enum status
  }
  invoice_items {
    uuid id PK
    uuid invoice_id FK
    text description
    int quantity
    bigint unit_cents
  }
  invoice_returns {
    uuid id PK
    uuid invoice_id FK
    date return_date
    bigint amount_cents
    text reason
  }
  invoice_payments {
    uuid id PK
    uuid invoice_id FK
    date paid_date
    bigint amount_cents
    text note
  }
```

`customer` is a name picked from Contacts and kept as plain text (not a foreign key). Deleting an
invoice cascades to its items, returns and payments. Rule: returns + payments <= total
(view `invoice_totals`).

### Vendor bills: money you owe

```mermaid
erDiagram
  bills ||--o{ bill_returns : "refunded by"
  bills ||--o{ bill_payments : "paid by"

  bills {
    uuid id PK
    text vendor
    text reference
    enum currency
    bigint amount_cents
    bigint discount_cents
    date bill_date
    date due_date
    enum status
  }
  bill_returns {
    uuid id PK
    uuid bill_id FK
    date return_date
    bigint amount_cents
    text reason
  }
  bill_payments {
    uuid id PK
    uuid bill_id FK
    date paid_date
    bigint amount_cents
    text note
  }
```

A bill has a single amount (no line items). `vendor` is plain text like `customer`. Deleting a bill
cascades to its returns and payments. Rule: returns + payments <= total (view `bill_totals`).

### Work: projects and tasks

```mermaid
erDiagram
  projects ||--o{ project_resources : "links to"
  projects |o--o{ tasks : contains

  projects {
    uuid id PK
    text name
    date start_date
    date end_date
  }
  project_resources {
    uuid id PK
    uuid project_id FK
    text title
    text url
  }
  tasks {
    uuid id PK
    uuid project_id FK
    text name
    text description
    date start_date
    date end_date
    enum category
  }
```

A task has a project or a category, never both. `RESTRICT`: a project with tasks cannot be deleted.
`CASCADE`: deleting a project removes its links.

### Standalone tables (no relations)

```mermaid
erDiagram
  assets {
    uuid id PK
    text name
    text category
    enum currency
    date purchase_date
    bigint purchase_cents
    bigint current_value_cents
  }
  subscriptions {
    uuid id PK
    text name
    bigint amount_cents
    enum currency
    text cycle "weekly, monthly, quarterly, yearly"
    date start_date
    enum status "active, paused, cancelled"
  }
  purchase_items {
    uuid id PK
    text name
    text url
    text note
  }
  stash_items {
    uuid id PK
    text title
    text content "link or text"
    enum status "pending, in-progress, done"
  }
  tickets {
    uuid id PK
    text title
    text requester
    enum priority
    enum status
  }
  currencies {
    uuid id PK
    char3 code UK
  }
  timezones {
    uuid id PK
    text city
    text time_zone
  }
  logos {
    uuid id PK
    text name
    text mime_type
    bytea image
  }
```

Views (derived, never stored): `wallet_balances`, `invoice_totals`, `bill_totals`.
