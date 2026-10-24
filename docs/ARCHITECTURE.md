# Personal Dashboard — Architecture

## 1. Goals

| Goal | How the architecture serves it |
|---|---|
| Aggregate data from many external APIs | Every API lives behind a **provider** with one common contract |
| Responsive | Mobile-first layout shell, container queries, a grid of self-contained widgets |
| Reusable code | Widgets are generic and data-driven; UI primitives, hooks and API client are shared |
| Easy to grow | Adding an integration = adding one folder; nothing else is edited except a registry line |

## 2. Stack

- **Next.js 16 (App Router)** + React 19 + TypeScript (strict)
- **shadcn/ui (radix-vega)** + Tailwind v4 — UI primitives
- **TanStack Query** — client-side caching, refetching, loading/error states
- **Zod** — runtime validation of every external API response and of env vars
- **Recharts** (via shadcn `chart`) — charts

## 3. Layered design

Dependencies point **downward only**. A layer never imports from a layer above it.

```
┌──────────────────────────────────────────────┐
│ app/            Routes, layouts (thin)       │
├──────────────────────────────────────────────┤
│ features/       One folder per integration   │
│                 (widgets + hooks + provider) │
├──────────────────────────────────────────────┤
│ components/     Shared, generic UI           │
│   dashboard/    layout shell, widget frame   │
│   ui/           shadcn primitives            │
├──────────────────────────────────────────────┤
│ lib/            api client, env, utils       │
└──────────────────────────────────────────────┘
```

## 4. Folder structure

```
src/
├─ app/
│  ├─ layout.tsx                  # providers (Query, Tooltip, Theme)
│  ├─ page.tsx                    # "/" — composes the dashboard from widgets
│  ├─ (pages)/                    # optional extra pages (settings, per-feature views)
│  └─ api/                        # Route Handlers = backend-for-frontend (BFF)
│     └─ [provider]/[resource]/route.ts
│
├─ features/                      # ONE FOLDER PER INTEGRATION
│  ├─ weather/
│  │  ├─ server.ts                # server-only: vendor call + Zod + map to domain type
│  │  ├─ api.ts                   # client call to our own /api route
│  │  ├─ types.ts                 # domain types (not the raw API shape)
│  │  ├─ hooks.ts                 # useWeather() — wraps TanStack Query
│  │  ├─ components/              # WeatherWidget.tsx, ForecastChart.tsx
│  │  └─ index.ts                 # public surface: exports the widget definition
│  ├─ github/ …
│  ├─ calendar/ …
│  └─ registry.ts                 # list of all widget definitions
│
├─ components/
│  ├─ ui/                         # shadcn (generated, don't hand-edit)
│  ├─ dashboard/
│  │  ├─ app-shell.tsx            # sidebar + header + content area
│  │  ├─ widget-grid.tsx          # responsive grid that renders the registry
│  │  ├─ widget-card.tsx          # frame: title, actions, loading/error/empty
│  │  ├─ stat-card.tsx            # reusable KPI card
│  │  └─ data-table.tsx           # reusable table
│  └─ charts/                     # generic AreaChart/BarChart wrappers over shadcn chart
│
├─ lib/
│  ├─ http/client.ts              # fetch wrapper: base URL, timeout, retry, typed errors
│  ├─ env.ts                      # Zod-validated env (server vs public)
│  ├─ query-client.ts
│  └─ utils.ts
│
├─ hooks/                         # cross-feature hooks (useMediaQuery, useLocalStorage)
└─ types/                         # shared types (Widget, ApiError, …)
```

## 5. Key abstractions

### 5.1 Widget definition (the core of reusability)

Every dashboard tile is described by data, and the grid renders from it. The page never
hard-codes widgets.

```ts
// types/widget.ts
export type WidgetDefinition = {
  id: string;                                  // "weather"
  title: string;
  component: React.ComponentType;              // self-fetching widget
  size: { base: 1 | 2 | 3; md?: 1 | 2 | 3; lg?: 1 | 2 | 3 | 4 }; // grid column spans
  enabled?: boolean;
};

// features/registry.ts
export const widgets: WidgetDefinition[] = [weatherWidget, githubWidget, calendarWidget];
```

`page.tsx` becomes: `<AppShell><WidgetGrid widgets={widgets} /></AppShell>`.
Adding an integration never touches the page or the grid.

### 5.2 Widget frame

`WidgetCard` takes `{ title, query, children }` and owns the **loading skeleton, error + retry,
empty state**. Each widget only writes its happy path. This removes the biggest source of
duplicated code in dashboards.

### 5.3 Provider boundary (API integration)

Each feature's `server.ts` follows the same 3 steps (`api.ts` is just the client call to our own route):

1. **Fetch** through the shared `lib/http/client.ts`
2. **Validate** with a Zod schema (`schema.parse`) — never trust external payloads
3. **Map** to a domain type (`WeatherSnapshot`), so UI never depends on a vendor's JSON shape

Swapping or upgrading a vendor then changes one file.

### 5.4 Backend-for-frontend (BFF)

Browsers never call third-party APIs that need secrets.

```
Browser ──> /api/github/repos  (Route Handler) ──> GitHub API
              │ holds token (server env)
              │ validates + maps response
              │ sets cache headers / revalidate
```

- API keys live in server-only env vars; never `NEXT_PUBLIC_*`.
- Public, keyless APIs can be called from a Server Component directly.
- The BFF also gives one place for rate-limit handling, caching, and CORS avoidance.

### 5.5 Data fetching strategy

| Case | Use |
|---|---|
| Initial, SEO-irrelevant, cacheable data | Server Component `fetch` with `next: { revalidate }` |
| Live / user-refreshable / polling data | Client widget + TanStack Query hitting `/api/*` |
| Mutations (e.g. add a todo) | Server Actions or `useMutation` → Route Handler |

Default to server fetching; opt into client queries only for widgets that need
refresh intervals or interactivity. Per-widget `staleTime` / `refetchInterval` lives in that
feature's hook.

## 6. Responsiveness

- **Mobile-first** Tailwind; the shell uses shadcn `Sidebar`, which collapses to an off-canvas
  sheet on mobile.
- **Widget grid**: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`; each widget declares its span
  from the registry (`size`).
- **Container queries** (`@container`, already used by dashboard-01) so a widget adapts to the
  space it is given, not the viewport — this is what makes widgets reusable across layouts.
- Tables: horizontal scroll or card-list fallback below `md`.
- Charts: `ResponsiveContainer`, simplified axes/ticks on small widths.
- Touch targets ≥ 44px; test at 360px, 768px, 1280px.

## 7. Error handling & resilience

- `lib/http/client.ts` throws a typed `ApiError` (`status`, `code`, `retryable`).
- Each widget is wrapped in an **Error Boundary**, so one failing API never breaks the page.
- TanStack Query: limited retries with backoff for retryable errors only.
- Zod failures are logged with the provider name and surfaced as "unexpected data" in the card.

## 8. Configuration & secrets

- `lib/env.ts` validates env at startup (fails fast with a clear message).
- `.env.local` for secrets (git-ignored); `.env.example` committed and kept in sync.
- Per-widget enable/disable via the registry (later: user settings).

## 9. Testing

| Level | Tool | Target |
|---|---|---|
| Unit | Vitest | Zod schemas, mappers, utils |
| Component | Testing Library | `WidgetCard` states, shared UI |
| API mocking | MSW | Feature hooks and widgets without hitting real APIs |
| E2E (later) | Playwright | Layout at mobile / desktop widths |

## 10. Conventions

- A feature folder exports only through its `index.ts`; other features must not reach inside.
- Features never import other features; shared needs move down to `components/` or `lib/`.
- Domain types in components, never raw API types.
- shadcn files in `components/ui` are regenerated, not edited; wrap them instead.
- ESLint `import/no-restricted-paths` (or boundaries plugin) to enforce the layer rules.

## 11. Recommended build order

1. Add `lib/http`, `lib/env`, Query provider, `types/widget.ts`.
2. Build `WidgetCard`, `WidgetGrid`, `AppShell`; convert the current dashboard-01 sample
   cards/chart/table into generic components fed by props.
3. Implement **one** feature end-to-end (e.g. weather — keyless API) to validate the pattern.
4. Add a second, secret-bearing feature (e.g. GitHub) to validate the BFF path.
5. Add tests for the shared pieces, then lint boundaries.
6. Later: persisted layout / user settings, auth if it ever becomes multi-user.

## 12. Persistence and cross-feature use

- Personal data lives in Supabase (Postgres). `lib/storage/supabase-store.ts` implements the store
  interface (`list/get/create/update/remove`) over a table plus optional child tables, converting
  between the app's camelCase domain objects and snake_case columns and validating every read with the
  feature's Zod schema. Only `features/*/server.ts` may use it, with the server-only secret key from
  `lib/supabase/admin.ts`. Row Level Security is on for every table with no policies, so the browser's
  publishable key cannot read or write data. The earlier `data/*.json` store (`lib/storage/json-store.ts`)
  is kept only for reference and is no longer used by any feature.
- A feature may use another through its public entry only (`@/features/contacts`, or
  `@/features/contacts/server` from `server.ts`). Debts -> Contacts is the first such edge; cycles
  are not allowed. Enforced by ESLint.
- Page features (Debts, Contacts) export a page component instead of / in addition to a widget.

## 13. Deliberately not included (YAGNI)

State library (Redux/Zustand), a real database server, per-user data, and a monorepo. A single-user
dashboard doesn't need them; each can be added later without restructuring because of the layer rules above.

## 14. Login (Supabase Auth)

- Sign-in is Supabase Auth email + password. `POST /api/auth/login` (thin, rate-limited) calls
  `signInWithPassword` through `lib/supabase/server.ts`; `POST /api/auth/logout` signs out. The session
  lives in Supabase's cookies.
- `src/proxy.ts` validates the session on every request via `readSession()` (`lib/auth/session.ts`,
  `getClaims()`, refreshing cookies) and requires the claim's email to equal `AUTH_OWNER_EMAIL`, so an
  extra Supabase user (e.g. from open sign-ups) still cannot get in. It fails closed when unconfigured.
- Data stays single-owner and shared: no `user_id` columns; features keep using the secret key via
  `lib/supabase/admin.ts` with RLS on and no policies. Per-user data would be a separate migration.
