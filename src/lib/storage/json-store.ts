import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { getServerEnv } from "@/lib/env";

/**
 * Tiny file-backed collection for personal data (one JSON file per collection).
 * Server-only. Writes are serialized and atomic (temp file + rename).
 * To move to a real database later, keep this interface and swap the implementation.
 */
export type JsonStore<T extends { id: string }> = {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  /** Creates a record, assigning `id` and `createdAt`. */
  create(input: Omit<T, "id" | "createdAt">): Promise<T>;
  /**
   * Replaces a record's editable fields (id and createdAt are kept). Fields missing from
   * `input` are cleared. Resolves to undefined when no record has that id.
   */
  update(id: string, input: Omit<T, "id" | "createdAt">): Promise<T | undefined>;
  /** Deletes a record; resolves to false when no record has that id. */
  remove(id: string): Promise<boolean>;
};

type Timestamped = { id: string; createdAt: string };

// One write queue per file so concurrent requests can't clobber each other.
const queues = new Map<string, Promise<unknown>>();

function enqueue<R>(file: string, task: () => Promise<R>): Promise<R> {
  const run = (queues.get(file) ?? Promise.resolve()).then(task, task);
  queues.set(
    file,
    run.catch(() => undefined)
  );
  return run;
}

export function createJsonStore<T extends Timestamped>(
  name: string,
  schema: z.ZodType<T>
): JsonStore<T> {
  const filePath = () => path.join(process.cwd(), getServerEnv().DATA_DIR, `${name}.json`);

  async function readAll(): Promise<T[]> {
    try {
      const raw = await readFile(filePath(), "utf8");
      return z.array(schema).parse(JSON.parse(raw));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async function writeAll(items: T[]): Promise<void> {
    const file = filePath();
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
    await rename(tmp, file);
  }

  return {
    list: readAll,
    async get(id) {
      return (await readAll()).find((item) => item.id === id);
    },
    create(input) {
      return enqueue(filePath(), async () => {
        const items = await readAll();
        const item = schema.parse({
          ...input,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
        });
        await writeAll([...items, item]);
        return item;
      });
    },
    update(id, input) {
      return enqueue(filePath(), async () => {
        const items = await readAll();
        const current = items.find((item) => item.id === id);
        if (!current) return undefined;
        const next = schema.parse({ ...input, id: current.id, createdAt: current.createdAt });
        await writeAll(items.map((item) => (item.id === id ? next : item)));
        return next;
      });
    },
    remove(id) {
      return enqueue(filePath(), async () => {
        const items = await readAll();
        const kept = items.filter((item) => item.id !== id);
        if (kept.length === items.length) return false;
        await writeAll(kept);
        return true;
      });
    },
  };
}
