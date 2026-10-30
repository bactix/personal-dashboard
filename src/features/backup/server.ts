import ExcelJS from "exceljs";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { BACKUP_MODULES, type BackupModuleId } from "./modules";

// Server-only: reads the tables of the chosen modules and writes them into one Excel workbook,
// one sheet per table. Used by app/api/backup.

/** Rows per request; Supabase caps a single response (default 1000), so tables page through. */
const PAGE_SIZE = 1000;

/** Columns that hold file bytes; a logo image would overflow an Excel cell, so only a note is kept. */
const BINARY_COLUMNS = new Set(["image"]);

/** Excel stops a cell at 32,767 characters. */
const MAX_CELL = 32_000;

type Row = Record<string, unknown>;

async function readTable(table: string): Promise<Row[]> {
  const supabase = getSupabaseAdmin();
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id", { ascending: true }) // every table has an id; not every table has created_at
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

function cell(column: string, value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (BINARY_COLUMNS.has(column)) return "(file not included)";
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > MAX_CELL ? text.slice(0, MAX_CELL) : text;
}

/** An .xlsx workbook with one sheet per table of the given modules. */
export async function createBackup(moduleIds: readonly BackupModuleId[]): Promise<Buffer> {
  const tables = BACKUP_MODULES.filter((module) => moduleIds.includes(module.id)).flatMap(
    (module) => module.tables
  );
  const data = await Promise.all(tables.map(async (table) => [table, await readTable(table)] as const));

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  for (const [table, rows] of data) {
    const sheet = workbook.addWorksheet(table);
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    sheet.columns = columns.map((key) => ({ header: key, key, width: Math.min(Math.max(key.length + 2, 14), 40) }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    for (const row of rows) {
      sheet.addRow(Object.fromEntries(columns.map((key) => [key, cell(key, row[key])])));
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
