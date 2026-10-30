import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

import { InUseError } from "@/lib/api/delete-route";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import type { JsonStore } from "./json-store";

/**
 * Supabase (Postgres) implementation of the same store interface the JSON files used, so each
 * feature's server.ts keeps its business rules and only changes how it is constructed.
 * Server-only. A record is one row in `table`, plus optional child rows (phones, invoice items, ...)
 * in other tables that are read, kept in order and rewritten together with their parent.
 *
 * Records convert between the app's camelCase domain objects and snake_case columns; a `null`
 * column becomes a missing field. Everything read is validated with the feature's Zod schema.
 */

type Row = Record<string, unknown>;
type Timestamped = { id: string; createdAt: string };
type EditableOf<T> = Omit<T, "id" | "createdAt">;

/** Rows per request; Supabase caps a single response (default 1000), so lists page through. */
const PAGE_SIZE = 1000;

export type ChildTable<Input> = {
  table: string;
  /** Column in the child table that points at the parent's id. */
  fk: string;
  /** Columns to read (the fk is added for you), e.g. "id,phone,position". */
  columns: string;
  /** Column that gives the stored order, ascending. */
  order?: string;
  /**
   * Write the new rows before deleting the old ones, so the parent is never briefly empty.
   * Needed when a database rule looks at the sum of these rows (invoice lines vs. payments);
   * leave it off when rows must be unique per parent (a phone number can't exist twice).
   */
  insertBeforeDelete?: boolean;
  /**
   * The rows the parent should have after a save, without the fk. A row that carries an `id`
   * is updated in place and keeps it; rows without one are inserted fresh.
   */
  toRows(input: Input): Row[];
  /** Puts this table's rows onto the domain object being built (mutates `candidate`). */
  attach(candidate: Row, rows: Row[]): void;
};

export type SupabaseStoreConfig<T extends Timestamped> = {
  table: string;
  schema: z.ZodType<T>;
  /** Domain key -> column name, where it is not simply camelCase <-> snake_case. */
  rename?: Record<string, string>;
  /** Domain keys that live in child tables, not in this table's columns. */
  exclude?: string[];
  /** Adjust a record after the default conversion from a row (enum spellings, bytes, ...). */
  readFix?(candidate: Row, raw: Row): void;
  /** Adjust the row before it is written. */
  writeFix?(row: Row, input: EditableOf<T>): void;
  children?: ChildTable<EditableOf<T>>[];
};

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const toSnake = (value: string) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

function fail(error: PostgrestError): Error {
  // 23503 = foreign key violation: something still references this record.
  if (error.code === "23503") return new InUseError("This record is still used by other records.");
  return new Error(`Supabase: ${error.message}${error.code ? ` (${error.code})` : ""}`);
}

async function fetchAll(table: string, columns: string, order: string): Promise<Row[]> {
  const db = getSupabaseAdmin();
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order(order)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw fail(error);
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function createSupabaseStore<T extends Timestamped>(config: SupabaseStoreConfig<T>): JsonStore<T> {
  const { table, schema, rename = {}, exclude = [], readFix, writeFix, children = [] } = config;
  const columnToKey = Object.fromEntries(Object.entries(rename).map(([key, column]) => [column, key]));
  const db = () => getSupabaseAdmin();

  function candidateFrom(raw: Row): Row {
    const candidate: Row = {};
    for (const [column, value] of Object.entries(raw)) {
      if (value === null || value === undefined) continue;
      candidate[columnToKey[column] ?? toCamel(column)] = value;
    }
    readFix?.(candidate, raw);
    return candidate;
  }

  function rowFrom(input: EditableOf<T>): Row {
    const row: Row = {};
    for (const [key, value] of Object.entries(input as Row)) {
      if (exclude.includes(key)) continue;
      row[rename[key] ?? toSnake(key)] = value === undefined ? null : value;
    }
    writeFix?.(row, input);
    return row;
  }

  const childColumns = (child: ChildTable<EditableOf<T>>) => `${child.columns},${child.fk}`;

  async function childRows(child: ChildTable<EditableOf<T>>, parentId?: string): Promise<Row[]> {
    if (parentId === undefined) return fetchAll(child.table, childColumns(child), child.order ?? child.fk);
    let query = db().from(child.table).select(childColumns(child)).eq(child.fk, parentId);
    if (child.order) query = query.order(child.order);
    const { data, error } = await query;
    if (error) throw fail(error);
    return (data ?? []) as unknown as Row[];
  }

  /** Insert-first variant of the sync: add/update the new rows, then delete the ones no longer wanted. */
  async function syncInsertFirst(child: ChildTable<EditableOf<T>>, parentId: string, rows: Row[]) {
    const keepIds = rows.map((row) => row.id).filter((id): id is string => typeof id === "string");
    const { data: existing, error: readError } = await db().from(child.table).select("id").eq(child.fk, parentId);
    if (readError) throw fail(readError);
    const oldIds = ((existing ?? []) as Row[]).map((row) => row.id as string);

    const withId = rows.filter((row) => row.id !== undefined);
    const withoutId = rows.filter((row) => row.id === undefined);
    if (withId.length > 0) {
      const { error } = await db().from(child.table).upsert(withId, { onConflict: "id" });
      if (error) throw fail(error);
    }
    let insertedIds: string[] = [];
    if (withoutId.length > 0) {
      const { data, error } = await db().from(child.table).insert(withoutId).select("id");
      if (error) throw fail(error);
      insertedIds = ((data ?? []) as Row[]).map((row) => row.id as string);
    }

    const stale = oldIds.filter((id) => !keepIds.includes(id));
    if (stale.length > 0) {
      const { error } = await db().from(child.table).delete().in("id", stale);
      if (error) {
        // A rule refused the smaller set: take the rows just added back out so nothing doubles up.
        if (insertedIds.length > 0) await db().from(child.table).delete().in("id", insertedIds);
        throw fail(error);
      }
    }
  }

  /** Makes the parent's child rows equal `toRows(input)`: delete the rest, update, insert. */
  async function syncChildren(parentId: string, input: EditableOf<T>) {
    for (const child of children) {
      // Client-supplied ids are only honoured when they already belong to this parent; any other
      // id is dropped (the row is inserted fresh), so it can't hijack another parent's row or
      // end up inside the `not in (...)` filter below.
      const { data: owned, error: ownedError } = await db().from(child.table).select("id").eq(child.fk, parentId);
      if (ownedError) throw fail(ownedError);
      const ownedIds = new Set(((owned ?? []) as Row[]).map((row) => row.id));
      const rows = child.toRows(input).map((row) => {
        const { id, ...rest } = row;
        return { ...(ownedIds.has(id) ? { id } : {}), ...rest, [child.fk]: parentId };
      });
      if (child.insertBeforeDelete) {
        await syncInsertFirst(child, parentId, rows);
        continue;
      }
      const keepIds = rows.map((row) => row.id).filter((id): id is string => typeof id === "string");

      let removal = db().from(child.table).delete().eq(child.fk, parentId);
      if (keepIds.length > 0) removal = removal.not("id", "in", `(${keepIds.join(",")})`);
      const removed = await removal;
      if (removed.error) throw fail(removed.error);

      const withId = rows.filter((row) => row.id !== undefined);
      const withoutId = rows.filter((row) => row.id === undefined);
      if (withId.length > 0) {
        const { error } = await db().from(child.table).upsert(withId, { onConflict: "id" });
        if (error) throw fail(error);
      }
      if (withoutId.length > 0) {
        const { error } = await db().from(child.table).insert(withoutId);
        if (error) throw fail(error);
      }
    }
  }

  function build(raw: Row, byChild: Row[][]): T {
    const candidate = candidateFrom(raw);
    children.forEach((child, index) => {
      const mine = byChild[index].filter((row) => row[child.fk] === raw.id);
      child.attach(candidate, mine);
    });
    return schema.parse(candidate);
  }

  async function get(id: string): Promise<T | undefined> {
    const { data, error } = await db().from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw fail(error);
    if (!data) return undefined;
    const byChild = await Promise.all(children.map((child) => childRows(child, id)));
    return build(data as Row, byChild);
  }

  return {
    async list() {
      const [raws, ...byChild] = await Promise.all([
        fetchAll(table, "*", "id"),
        ...children.map((child) => childRows(child)),
      ]);
      return raws.map((raw) => build(raw, byChild));
    },

    get,

    async create(input) {
      const { data, error } = await db().from(table).insert(rowFrom(input)).select("*").single();
      if (error) throw fail(error);
      const id = (data as Row).id as string;
      try {
        await syncChildren(id, input);
      } catch (cause) {
        await db().from(table).delete().eq("id", id); // don't leave a half-saved parent behind
        throw cause;
      }
      return (await get(id)) as T;
    },

    async update(id, input) {
      const { data: current, error: readError } = await db().from(table).select("*").eq("id", id).maybeSingle();
      if (readError) throw fail(readError);
      if (!current) return undefined;

      const row = rowFrom(input);
      // Fields missing from `input` are cleared, as with the old file store.
      for (const column of Object.keys(current as Row)) {
        if (column !== "id" && column !== "created_at" && !(column in row)) row[column] = null;
      }
      const { error } = await db().from(table).update(row).eq("id", id);
      if (error) throw fail(error);
      await syncChildren(id, input);
      return get(id);
    },

    async remove(id) {
      const attempt = () => db().from(table).delete().eq("id", id).select("id");
      let { data, error } = await attempt();
      // Only when the blocker is one of this store's own child tables (no ON DELETE CASCADE in the
      // database); a violation from any other table means the record really is in use.
      const blockedByOwnChild = children.some((child) => error?.message.includes(`"${child.table}"`));
      if (error?.code === "23503" && blockedByOwnChild) {
        for (const child of children) {
          const removed = await db().from(child.table).delete().eq(child.fk, id);
          if (removed.error) throw fail(removed.error);
        }
        ({ data, error } = await attempt());
      }
      if (error) throw fail(error);
      return (data ?? []).length > 0;
    },
  };
}
