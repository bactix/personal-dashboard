import { escapeHtml } from "@/lib/print/print-html";
import { formatMoney } from "@/lib/money";

import {
  billOutstandingCents,
  billTotalCents,
  invoiceOutstandingCents,
  invoiceSubtotalCents,
  invoiceTotalCents,
  paidCents,
  paymentStatus,
  returnedCents,
} from "./totals";
import type { Bill, Invoice } from "./types";

// Builds the printable (A4) HTML for an invoice or vendor bill. Pass the result to printHtml().

const STYLES = `
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif; color: #111; font-size: 13px; line-height: 1.45; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
  h1 { font-size: 28px; letter-spacing: 0.08em; margin: 0 0 4px; }
  .muted { color: #666; }
  .meta { text-align: right; }
  .meta div { margin-bottom: 2px; }
  .party { margin-bottom: 24px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 2px; }
  .party-name { font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #111; padding: 6px 8px; }
  td { padding: 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .totals { margin-left: auto; width: 55%; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 8px; font-variant-numeric: tabular-nums; }
  .totals .grand { border-top: 2px solid #111; font-size: 16px; font-weight: 700; margin-top: 4px; padding-top: 8px; }
  .notes { margin-top: 28px; }
  .notes p { white-space: pre-wrap; margin: 4px 0 0; }
`;

function page(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${STYLES}</style></head><body>${body}</body></html>`;
}

function notesBlock(notes?: string): string {
  if (!notes) return "";
  return `<div class="notes"><div class="label">Notes</div><p dir="auto">${escapeHtml(notes)}</p></div>`;
}

/** `discountCents` is shown as a negative line, and only when there is one. */
function totalsBlock(
  rows: { label: string; value: string }[],
  totalCents: number,
  discount: number,
  currency: string,
  returned = 0,
  paid = 0
): string {
  const money = (cents: number) => escapeHtml(formatMoney(cents, currency));
  const line = (label: string, value: string, grand = false) =>
    `<div${grand ? ' class="grand"' : ""}><span>${label}</span><span>${value}</span></div>`;

  const lines = rows.map((row) => line(escapeHtml(row.label), escapeHtml(row.value)));
  if (discount > 0) lines.push(line("Discount", `−${money(discount)}`));

  // The last figure shown is the grand total: the balance due once payments are in, else the
  // net after returns, else the plain total.
  if (returned > 0 || paid > 0) {
    lines.push(line("Total", money(totalCents)));
    if (returned > 0) lines.push(line("Returns", `−${money(returned)}`));
    const net = totalCents - returned;
    if (paid > 0) {
      lines.push(line("Paid", `−${money(paid)}`));
      lines.push(line("Balance due", money(net - paid), true));
    } else {
      lines.push(line("Net total", money(net), true));
    }
  } else {
    lines.push(line("Total", money(totalCents), true));
  }
  return `<div class="totals">${lines.join("")}</div>`;
}

export function invoiceHtml(invoice: Invoice): string {
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const status = paymentStatus(invoice, null, invoiceOutstandingCents(invoice)).label;

  const rows = invoice.items
    .map(
      (item) => `<tr>
        <td dir="auto">${escapeHtml(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${escapeHtml(money(item.unitCents))}</td>
        <td class="num">${escapeHtml(money(item.quantity * item.unitCents))}</td>
      </tr>`
    )
    .join("");

  return page(
    `Invoice ${invoice.number}`,
    `<header>
      <div>
        <h1>INVOICE</h1>
        <div class="muted">${escapeHtml(invoice.number)}</div>
      </div>
      <div class="meta">
        <div><span class="muted">Issued:</span> ${escapeHtml(invoice.issueDate)}</div>
        <div><span class="muted">Due:</span> ${escapeHtml(invoice.dueDate)}</div>
        <div><span class="muted">Status:</span> ${escapeHtml(status)}</div>
      </div>
    </header>
    <div class="party">
      <div class="label">Bill to</div>
      <div class="party-name" dir="auto">${escapeHtml(invoice.customer)}</div>
    </div>
    <table>
      <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${totalsBlock(
      [{ label: "Subtotal", value: money(invoiceSubtotalCents(invoice.items)) }],
      invoiceTotalCents(invoice),
      invoice.discountCents,
      invoice.currency,
      returnedCents(invoice),
      paidCents(invoice)
    )}
    ${notesBlock(invoice.notes)}`
  );
}

export function billHtml(bill: Bill): string {
  const money = (cents: number) => formatMoney(cents, bill.currency);
  const status = paymentStatus(bill, null, billOutstandingCents(bill)).label;

  return page(
    `Vendor bill ${bill.reference ?? bill.vendor}`,
    `<header>
      <div>
        <h1>VENDOR BILL</h1>
        ${bill.reference ? `<div class="muted" dir="auto">Ref: ${escapeHtml(bill.reference)}</div>` : ""}
      </div>
      <div class="meta">
        <div><span class="muted">Bill date:</span> ${escapeHtml(bill.billDate)}</div>
        <div><span class="muted">Due:</span> ${escapeHtml(bill.dueDate)}</div>
        <div><span class="muted">Status:</span> ${escapeHtml(status)}</div>
      </div>
    </header>
    <div class="party">
      <div class="label">Vendor</div>
      <div class="party-name" dir="auto">${escapeHtml(bill.vendor)}</div>
    </div>
    ${totalsBlock(
      [{ label: "Amount", value: money(bill.amountCents) }],
      billTotalCents(bill),
      bill.discountCents,
      bill.currency,
      returnedCents(bill),
      paidCents(bill)
    )}
    ${notesBlock(bill.notes)}`
  );
}
