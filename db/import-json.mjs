// One-off: copy the old local data (data/*.json) into Supabase.
//
//   node --env-file=.env.local db/import-json.mjs            # dry run: only counts, writes nothing
//   node --env-file=.env.local db/import-json.mjs --apply    # really import
//
// Safe to repeat: every row keeps its original id (child rows get stable ids), and rows that
// already exist are skipped. The JSON files are only read, never changed or deleted.
// Run db/001-align-supabase.sql in Supabase first.

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const dataDir = path.join(process.cwd(), process.env.DATA_DIR || "data");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------- helpers
function read(name) {
  const file = path.join(dataDir, `${name}.json`);
  if (!existsSync(file)) return [];
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

/** A uuid that is always the same for the same inputs, so re-running never duplicates children. */
function stableId(...parts) {
  const h = createHash("sha256").update(parts.join("|")).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const nul = (value) => (value === undefined || value === "" ? null : value);
const localDay = (iso) => new Date(iso).toLocaleDateString("en-CA");

/** Same rule as src/lib/phone.ts: add the country code, drop a leading 0. */
function normalizePhone(raw) {
  const text = String(raw).trim().replace(/[()]/g, "").replace(/\s+/g, " ");
  if (text.startsWith("+")) return text.replace(/^\+961\s*0+\s*/, "+961 ");
  if (/^00/.test(text)) return text.replace(/^00\s*/, "+");
  return `+961 ${text.replace(/^0+\s*/, "")}`;
}

const report = [];
async function load(table, rows, options = {}) {
  const entry = { table, found: rows.length, inserted: 0, skipped: 0, failed: 0 };
  report.push(entry);
  if (rows.length === 0) return;
  const conflict = options.conflict ?? "id";
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    if (!apply) { entry.inserted += chunk.length; continue; }
    const { data, error } = await db
      .from(table)
      .upsert(chunk, { onConflict: conflict, ignoreDuplicates: true })
      .select(conflict);
    if (error) {
      entry.failed += chunk.length;
      console.error(`  ! ${table}: ${error.message}`);
      continue;
    }
    entry.inserted += data.length;
    entry.skipped += chunk.length - data.length;
  }
}

// ---------------------------------------------------------------- mapping, in dependency order
const DIRECTION = { "i-owe": "i_owe", "owed-to-me": "owed_to_me" };

await load("currencies", read("currencies").map((r) => ({ id: r.id, code: r.code, created_at: r.createdAt })), { conflict: "code" });
await load("timezones", read("timezones").map((r) => ({ id: r.id, city: r.city, time_zone: r.timeZone, created_at: r.createdAt })));
await load("logos", read("logos").flatMap((r) => {
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(r.image ?? "");
  if (!m) { console.error(`  ! logos: ${r.id} has no usable image, skipped`); return []; }
  return [{ id: r.id, name: r.name, mime_type: m[1], image: `\\x${Buffer.from(m[2], "base64").toString("hex")}`, created_at: r.createdAt }];
}));

const contacts = read("contacts");
await load("contacts", contacts.map((r) => ({ id: r.id, name: r.name, created_at: r.createdAt })));
await load("contact_phones", contacts.flatMap((c) => {
  const phones = c.phones ?? (c.phone ? [c.phone] : []); // older contacts have one `phone`
  return [...new Set(phones.map(normalizePhone))].map((phone, position) => ({
    id: stableId("phone", c.id, position), contact_id: c.id, phone, position, created_at: c.createdAt,
  }));
}));
await load("contact_emails", contacts.flatMap((c) =>
  [...new Set(c.emails ?? [])].map((email, position) => ({
    id: stableId("email", c.id, position), contact_id: c.id, email, position, created_at: c.createdAt,
  }))
));

await load("purchase_items", read("purchases").map((r) => ({
  id: r.id, name: r.name, url: nul(r.url), note: nul(r.note), created_at: r.createdAt,
})));
await load("stash_items", read("stash").map((r) => ({
  id: r.id, title: r.title, content: r.content, status: r.status, created_at: r.createdAt,
})));

const projects = read("projects");
await load("projects", projects.map((r) => ({
  id: r.id, name: r.name, start_date: r.startDate ?? localDay(r.createdAt), end_date: nul(r.endDate), created_at: r.createdAt,
})));
await load("project_resources", projects.flatMap((p) =>
  (p.resources ?? []).map((res, position) => ({
    id: stableId("resource", p.id, position), project_id: p.id, title: res.title ?? "", url: res.url, position, created_at: p.createdAt,
  }))
));

await load("tasks", read("tasks").map((r) => ({
  id: r.id, name: r.name, description: nul(r.description),
  start_date: r.startDate ?? localDay(r.createdAt), end_date: nul(r.endDate ?? r.deadline), // `deadline` = old name of endDate
  project_id: nul(r.projectId), category: nul(r.category), created_at: r.createdAt,
})));
await load("tickets", read("tickets").map((r) => ({
  id: r.id, title: r.title, description: nul(r.description), requester: nul(r.requester),
  priority: r.priority, status: r.status, created_at: r.createdAt,
})));

await load("wallets", read("wallets").map((r) => ({ id: r.id, name: r.name, currency: r.currency, created_at: r.createdAt })));
await load("transactions", read("transactions").map((r) => ({
  id: r.id, wallet_id: r.walletId, type: r.type, amount_cents: r.amountCents,
  note: nul(r.note), txn_date: r.date, created_at: r.createdAt,
})));
await load("goals", read("goals").map((r) => ({
  id: r.id, wallet_id: r.walletId, target_cents: r.targetCents, target_date: nul(r.targetDate), created_at: r.createdAt,
})));
await load("budgets", read("budgets").map((r) => ({
  id: r.id, name: nul(r.name), category: r.category ?? "other", currency: r.currency, limit_cents: r.limitCents,
  created_at: r.createdAt,
})));
await load("assets", read("assets").map((r) => ({
  id: r.id, name: r.name, category: nul(r.category), currency: r.currency, purchase_date: r.purchaseDate,
  purchase_cents: r.purchaseCents, current_value_cents: r.currentValueCents, notes: nul(r.notes), created_at: r.createdAt,
})));
await load("debts", read("debts").map((r) => ({
  id: r.id, contact_id: r.contactId, direction: DIRECTION[r.direction], amount_cents: r.amountCents, currency: r.currency,
  description: nul(r.description), due_date: nul(r.dueDate), created_at: r.createdAt,
})));

const invoices = read("invoices");
await load("invoices", invoices.map((r) => ({
  id: r.id, number: r.number, customer: r.customer, currency: r.currency, discount_cents: r.discountCents ?? 0,
  issue_date: r.issueDate, due_date: nul(r.dueDate), status: r.status, notes: nul(r.notes), created_at: r.createdAt,
})));
await load("invoice_items", invoices.flatMap((i) => (i.items ?? []).map((item, position) => ({
  id: stableId("invoice-item", i.id, position), invoice_id: i.id, description: item.description, quantity: item.quantity,
  unit_cents: item.unitCents, position, created_at: i.createdAt,
}))));
await load("invoice_returns", invoices.flatMap((i) => (i.returns ?? []).map((x) => ({
  id: x.id, invoice_id: i.id, return_date: x.date, amount_cents: x.amountCents, reason: nul(x.reason), created_at: i.createdAt,
}))));
await load("invoice_payments", invoices.flatMap((i) => (i.payments ?? []).map((x) => ({
  id: x.id, invoice_id: i.id, paid_date: x.date, amount_cents: x.amountCents, note: nul(x.note), created_at: i.createdAt,
}))));

const bills = read("bills");
await load("bills", bills.map((r) => ({
  id: r.id, vendor: r.vendor, reference: nul(r.reference), currency: r.currency, amount_cents: r.amountCents,
  discount_cents: r.discountCents ?? 0, bill_date: r.billDate, due_date: nul(r.dueDate), status: r.status,
  notes: nul(r.notes), created_at: r.createdAt,
})));
await load("bill_returns", bills.flatMap((b) => (b.returns ?? []).map((x) => ({
  id: x.id, bill_id: b.id, return_date: x.date, amount_cents: x.amountCents, reason: nul(x.reason), created_at: b.createdAt,
}))));
await load("bill_payments", bills.flatMap((b) => (b.payments ?? []).map((x) => ({
  id: x.id, bill_id: b.id, paid_date: x.date, amount_cents: x.amountCents, note: nul(x.note), created_at: b.createdAt,
}))));

// ---------------------------------------------------------------- summary
console.log(apply ? "\nImported into Supabase:\n" : "\nDRY RUN (nothing written). Table by table:\n");
console.log("table".padEnd(20), "found".padStart(6), (apply ? "added" : "would add").padStart(10), "existing".padStart(9), "failed".padStart(7));
for (const r of report) {
  console.log(r.table.padEnd(20), String(r.found).padStart(6), String(r.inserted).padStart(10), String(r.skipped).padStart(9), String(r.failed).padStart(7));
}
const failed = report.reduce((n, r) => n + r.failed, 0);
if (failed > 0) { console.error(`\n${failed} row(s) failed. Fix the cause above and run again (finished rows are skipped).`); process.exit(1); }
if (!apply) console.log("\nLooks fine? Run again with --apply.");
