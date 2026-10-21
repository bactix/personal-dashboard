<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project architecture rules (MANDATORY)

This is a personal dashboard that aggregates external APIs. The full design is in
`docs/ARCHITECTURE.md` — read it before adding or changing a feature. **Every new
feature (a new API integration / dashboard widget) MUST follow this architecture.**
The reference implementation is `src/features/weather/` — copy its shape.

## Layers (dependencies point down only)

`app/` → `features/` → `components/` → `lib/`. Never import upward. `components/`, `lib/`, `hooks/`
never import from `features/`, and features never import from `app/`. A feature may depend on another
feature ONLY through its public entry (`@/features/<x>`, client-safe) or, from its own `server.ts`,
`@/features/<x>/server` — never deep paths, never circular. ESLint enforces this.

## Adding a feature — checklist

Create `src/features/<name>/` with:

| File | Responsibility |
|---|---|
| `types.ts` | App-owned domain types + Zod schema (never expose the vendor's raw shape to the UI) |
| `server.ts` | Server-only: call the vendor via `http()` from `@/lib/http/client`, validate with a private Zod schema, **map to the domain type**. Only file that may import `@/lib/env` |
| `api.ts` | Client-side: `http("/api/<name>", domainSchema)` against our own route |
| `hooks.ts` | `use<Name>()` wrapping TanStack Query (own `queryKey`, `staleTime`, `refetchInterval`) |
| `components/<name>-widget.tsx` | `"use client"`; render with `<WidgetCard query={...}>` and write only the happy path |
| `index.ts` | Exports a `WidgetDefinition` (id, title, component, `size`) for dashboard widgets, and/or the page component for page features (e.g. `DebtsPage`). Do NOT re-export `server.ts` |

Page features (a sidebar section like Debts/Contacts) follow the same layout; their route page is
`<AppShell title="…"><XPage /></AppShell>` and the sidebar entry is added in `src/config/navigation.ts`.
Features that write data add `POST` handlers, a `useMutation` hook that invalidates the list query,
and validate input with the same Zod schema on client and server.

Then:
1. Add `src/app/api/<name>/route.ts` (thin: call `server.ts`, return JSON, log + 502 on failure).
2. Register in `src/features/registry.ts`: `widgets` for the Home screen and `statsWidgets` for the Stats page (`/stats`; use `StatList` from `src/components/dashboard/stat-list.tsx`). Pages live in `src/app/(app)/` and render only their content: the shell, sidebar and header title come from `(app)/layout.tsx` and `src/config/navigation.ts`.
3. Declare new env vars in `src/lib/env.ts` (Zod) and `.env.example`.
4. Run `npx tsc --noEmit` and `npx eslint src` — no new errors.

## Hard rules

- All HTTP goes through `http()` in `src/lib/http/client.ts` (timeout, `ApiError`, Zod validation). No bare `fetch` in features.
- Secrets/API keys are server-only: read via `getServerEnv()`, never `NEXT_PUBLIC_*`, never in client code. Browsers call `/api/*`, not third-party APIs that need keys.
- Everything (pages and `/api/*`) is behind the login via `src/proxy.ts`; only `/login` and `/api/auth/login` are public. Never add a public path without being asked. `AUTH_DISABLED=true` in `.env.local` turns the gate off for local dev (ignored in production); never set it unless the owner asks. Session helpers live in `src/lib/auth/`; credentials come from `AUTH_PASSWORD` / `AUTH_SECRET` in `.env.local`.
- Money: use `src/lib/money.ts` (`CURRENCIES`, `parseAmountToCents`, `formatMoney`). One feature folder may serve several pages when their data is coupled (e.g. `wallets` serves Wallets and Transactions, since balances derive from transactions) — don't split into two features that would need to import each other.
- Personal data is persisted with `createJsonStore()` (`src/lib/storage/json-store.ts`, files in git-ignored `data/`). Only `server.ts` files touch it. Money is stored as integer minor units (cents), never floats.
- Validate every external payload with Zod; the UI consumes domain types only.
- Every list/table is paginated: `usePagination(items)` (`src/hooks/use-pagination.ts`) + `<ListPagination pagination={…} />` (`src/components/dashboard/list-pagination.tsx`), 10 per page. Totals and stats are computed from the full list, only the rendered rows come from `pagination.pageItems`.
- CRUD pages show only the list; the create form lives in an `Add<Thing>Dialog` (`features/<x>/components/add-<thing>-dialog.tsx`, shadcn `Dialog`, resets on close/success) passed to `WidgetCard` via `action={<Add<Thing>Dialog />}`. Never render an inline form above the list. Reference: `features/debts/components/add-debt-dialog.tsx`.
- Every CRUD list has a delete option: a `<DeleteButton itemLabel=… onDelete={() => del.mutateAsync(id)} />` (`src/components/dashboard/delete-button.tsx`, confirms first) per row. Backend: `store.remove(id)` → `remove<Thing>` in `server.ts` (returns false if missing; throw `InUseError` from `@/lib/api/delete-route` when other records still reference it) → `app/api/<x>/[id]/route.ts` using `deleteResponse()` → `delete<Thing>` in `api.ts` via `httpDelete` → `useDelete<Thing>` hook that invalidates the list. If the dependant lives in a feature that already imports this one, do the in-use check in the route instead (see `api/contacts/[id]`).
- Home tiles that list items use `<ScrollList>` (`src/components/dashboard/scroll-list.tsx`): 5 single-line rows visible, the rest scroll. Never read `new Date()` during render in a client component; use `useToday()` (`src/hooks/use-today.ts`).
- Every list is full CRUD. Edit = one dialog serving both add and edit (`<XDialog item={…}>`, trigger via `EditTrigger`), `PUT /api/<x>/[id]` through `updateResponse()` (`src/lib/api/update-route.ts`, same Zod schema as create, 404 / 400 / 409 handled), `store.update()`, and a `useUpdateX` hook. Delete uses `DeleteButton` + `deleteResponse()`. Show server 4xx messages with `userMessage()`.
- Loading / error / empty states come from `WidgetCard`; don't re-implement them per widget.
- Reuse before creating: check `src/components/dashboard/`, `src/components/ui/` (shadcn) and `src/lib/` first. Logic needed by 2+ features moves down to `components/` or `lib/`.
- Add UI primitives with `npx shadcn@latest add <component>`; don't hand-edit `src/components/ui/*`.
- Responsive by default: mobile-first Tailwind, container queries (`@container`) inside widgets, spans declared via `WidgetDefinition.size`. Verify at ~360px, 768px and 1280px.
- Use a Server Component `fetch` only for non-interactive, cacheable data; use TanStack Query for anything that refreshes or is interactive.
- If a requirement doesn't fit this architecture, say so and propose a change to `docs/ARCHITECTURE.md` first — don't work around it.

# Running the app (MANDATORY)

- **Never start the app or any long-running/background process** (`npm run dev`, `next dev`, `next start`, `npm start`, watchers, or anything run in the background). The owner always starts and stops these themselves.
- If a change needs the running app to be verified, say so and ask the owner to start it — don't start it, and don't kill or restart a server the owner is running.
- One-shot checks that finish on their own are fine: `npx tsc --noEmit`, `npx eslint src`.
- Don't test against a running server on the agent's own initiative; if one happens to be running, you may call its API, but clean up any test data you created (delete only records you created).
