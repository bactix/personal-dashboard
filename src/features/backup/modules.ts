// The modules a backup can cover, each with the database tables that belong to it. Client-safe.
// Keep in step with docs/schema.sql: a table missing here is missing from every backup.

export const BACKUP_MODULES = [
  { id: "wallets", label: "Wallets & transactions", tables: ["wallets", "transactions", "budgets", "goals"] },
  { id: "debts", label: "Debts", tables: ["debts", "debt_payments"] },
  { id: "subscriptions", label: "Subscriptions", tables: ["subscriptions", "subscription_payments"] },
  {
    id: "accounting",
    label: "Invoices & bills",
    tables: [
      "invoices",
      "invoice_items",
      "invoice_returns",
      "invoice_payments",
      "bills",
      "bill_returns",
      "bill_payments",
    ],
  },
  { id: "contacts", label: "Contacts", tables: ["contacts", "contact_phones", "contact_emails"] },
  { id: "purchases", label: "Purchases", tables: ["purchase_items"] },
  { id: "stash", label: "Stash", tables: ["stash_items"] },
  { id: "projects", label: "Projects", tables: ["projects", "project_resources"] },
  { id: "tasks", label: "Tasks", tables: ["tasks"] },
  { id: "helpdesk", label: "Helpdesk", tables: ["tickets"] },
  { id: "assets", label: "Assets", tables: ["assets"] },
  { id: "settings", label: "Settings (currencies, time zones, logos)", tables: ["currencies", "timezones", "logos"] },
] as const;

export type BackupModuleId = (typeof BACKUP_MODULES)[number]["id"];

export const isBackupModuleId = (value: string): value is BackupModuleId =>
  BACKUP_MODULES.some((module) => module.id === value);
