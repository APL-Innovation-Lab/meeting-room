# Contributor Guidelines

Austin Public Library meeting room booking prototype. A full-stack **React Router v8 (framework mode)** app: search library meeting rooms, view them on a Mapbox map, review/confirm a booking, cancel a reservation, and export a booking as an `.ics` file.

Stack: TypeScript, React 19, Vite, Tailwind CSS v4 + USWDS (`@trussworks/react-uswds`), Zod, Drizzle ORM on SQLite (libSQL, `@libsql/client`), Vitest, Oxfmt/Oxlint, Varlock for env validation.

## Rules (required reading)

Before writing code or committing, read and follow the rules in [`.agents/rules/`](./.agents/rules/):

- [`.agents/rules/code-quality.md`](./.agents/rules/code-quality.md) — file/function size limits, naming, separation of concerns, comment policy, YAGNI, error handling. Applies to **all** code you write here.
- [`.agents/rules/commit-discipline.md`](./.agents/rules/commit-discipline.md) — when to commit, one logical change per commit, Scoped Commits message format, staging by explicit path (never `git add .`/`-A`), no pushing unless asked.

These are binding, not suggestions. When rules conflict, optimize for the next reader and ask the user.

Reusable skills live in [`.agents/skills/`](./.agents/skills/) (`react-router`, `systematic-debugging`, `adversarial-review`) — use the relevant one when it matches your task.

## Commands

Node 24+ required (see `.node-version`).

| Task                                             | Command                  |
| ------------------------------------------------ | ------------------------ |
| Dev server                                       | `node --run dev`         |
| Full check (typegen, format, lint, types, tests) | `node --run check`       |
| Tests (single run)                               | `node --run test`        |
| Tests (watch)                                    | `npx vitest`             |
| Typecheck                                        | `node --run typecheck`   |
| Lint (with fixes)                                | `node --run lint`        |
| Format                                           | `node --run fmt`         |
| Generate DB migrations                           | `node --run db:generate` |
| Validate `.env`                                  | `node --run env:check`   |
| Production build                                 | `node --run build`       |

Run `node --run check` before declaring work done. Note: `lint` and `typecheck` run `react-router typegen` first — if route types (`./+types/*`) seem missing, run typegen rather than hand-writing types.

## Layout

```
app/
├── routes.ts            # Route config (react-router framework mode)
├── routes/              # Route modules, grouped by feature
│   ├── home/            # Landing page (RoomCard, FAQ, Header)
│   ├── search/          # :roomKind index — search UI + search.data.server.ts
│   ├── review/          # :roomKind/review — booking review
│   ├── confirm.tsx      # :roomKind/confirm
│   ├── cancel/          # :roomKind/cancel + cancel/confirm
│   └── calendar-ics.ts  # /calendar.ics resource route
├── lib/                 # Domain logic & data access
│   └── apl-client/      # APL data client; db/ holds Drizzle schema + repos
├── components/          # Shared presentational components (Map, Breadcrumbs, ...)
├── utils/               # Generic helpers (calendar, ...)
└── styles/tailwind.css
tailwindcss-uswds/       # Tailwind plugin bridging USWDS design tokens
drizzle/                 # Generated SQL migrations (do not edit by hand)
data/apl.db              # Local SQLite database
```

## Conventions

- **Tests are colocated**: `foo.test.ts(x)` sits next to `foo.ts(x)`. No parallel `tests/` tree. Coverage targets critical paths, not 100%.
- **Server-only code carries the `.server.ts` suffix** (e.g. `search.data.server.ts`, `db/client.server.ts`) so it never leaks into the client bundle. Keep it that way.
- **Group by feature, not by layer** — a route's components, data loaders, and tests live in its `routes/<feature>/` directory.
- **Components stay dumb**; domain logic lives in `app/lib/`. The domain layer doesn't import framework code.
- **Database**: `app/lib/apl-client/db/schema.ts` is the single source of truth. Change the schema → run `node --run db:generate` to produce a migration under `drizzle/` — never write migration SQL by hand. Migrations apply at runtime via the libSQL migrator in `db/client.server.ts`. `APL_DB_URL` selects the database: a local `file:` path by default, or a remote libSQL/sqld URL in deployment.
- **Environment**: `.env.schema` is the contract (Varlock-validated, types generated into `env.d.ts`). Add new env vars to `.env.schema`, not just `.env`. `.env` is gitignored — never commit it. `VITE_APP_MAPBOX_TOKEN` is deliberately a public token; do not mark it `@sensitive`.
- **Formatting/linting** is Oxfmt + Oxlint (configs: `.oxfmtrc.jsonc`, `.oxlintrc.jsonc`). Don't hand-format or fight the tools; run them.
- **Progressive enhancement**: routes should work without client JS where feasible — prefer React Router forms/actions over ad-hoc `fetch`.

## Gotchas

- `npm run` works, but this repo's docs standardize on `node --run <script>` for a faster-startup native script runner.
- `data/apl.db` (plus `-wal`/`-shm`) is local state — don't commit it or its journal files.
- `drizzle/` contents are generated artifacts; treat them as read-only outputs of `db:generate`.
