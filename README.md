# Meeting Room Prototype

This is the source code for the Austin Public Library meeting room booking page code prototype.

It's a full-stack [React Router](https://reactrouter.com) app that lets people search library meeting rooms, view their locations on a map, review and confirm a booking, cancel an existing reservation, and export a booking to their calendar as an `.ics` file.

## Frameworks & Technology

- [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React](https://react.dev)
- [Vite](https://vite.dev) for the dev server and production build
- [React Router v8](https://reactrouter.com) (framework mode)
    - [Route Module Type Safety](https://reactrouter.com/explanation/type-safety)
    - [Progressive enhancement](https://reactrouter.com/explanation/progressive-enhancement)
- [Zod](https://zod.dev) for schema validation
- [Tailwind CSS v4](https://tailwindcss.com)
- [USWDS](https://designsystem.digital.gov)
    - [trussworks/react-uswds](https://trussworks.github.io/react-uswds/?path=/docs/welcome--docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides)
- [Drizzle ORM](https://orm.drizzle.team) on SQLite (libSQL, [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts))
- [Varlock](https://varlock.dev) for environment variable schema, validation, and type generation
- [npm](https://docs.npmjs.com/cli/v11)
- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) for formatting
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) for linting
- [Vitest](https://vitest.dev) for testing
- [Visual Studio Code](https://code.visualstudio.com) (or one of its derivatives)

# Project Layout

```
.
├── app
│   ├── components          # Shared React components (Map, Breadcrumbs, Spinner, ...)
│   ├── lib                 # Domain logic & data access (apl-client, room, site, constants, ...)
│   ├── routes              # Route modules (home, search, review, confirm, cancel, calendar.ics)
│   ├── utils               # Generic helpers (calendar, ...)
│   ├── styles
│   │   └── tailwind.css
│   ├── entry.server.tsx
│   ├── root.tsx
│   └── routes.ts
├── public                  # Static assets (favicon, fonts)
├── tailwindcss-uswds       # Tailwind plugin + build scripts that bridge USWDS design tokens
├── .env.example            # Template — copy to .env and fill in
├── .env.schema             # Environment contract validated by Varlock
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

## Contributing

This prototype is built and maintained by a small team of mostly volunteers – we'd love your help to fix bugs and add features!

There is a short guide for setting up a local development environment in [CONTRIBUTING.md](./CONTRIBUTING.md) if you wish to contribute changes, fixes, and improvements to the Meeting Room prototype.

Before submitting a pull request, please discuss with the core team by creating or commenting in an issue on GitHub – we'd also love to hear from you in the discussions. This way we can ensure that an approach is agreed on before code is written. This will result in a much higher likelihood of your code being accepted.

If you’re looking for ways to get started, here's a list of ways to help us improve this prototype:

- Issues with [good first issue label](https://github.com/APL-Innovation-Lab/meeting-room-prototype/labels/good%20first%20issue)
- Developer happiness and documentation
- Bugs and other issues listed on GitHub

## Tests

We aim to have sufficient test coverage for critical parts of the prototype and aren't aiming for 100% unit test coverage.

To add new tests, write your tests with Vitest in a `.test.ts` (or `.test.tsx`) file in the same directory as the tested code.

```sh
# Run the full test suite once
node --run test

# Run tests in watch mode
npx vitest
```

## Deployment

The prototype deploys to [Railway](https://railway.com) as a Docker image. The repo deliberately has **no `railway.json`/`railway.toml`** — Railway auto-detects the root [`Dockerfile`](./Dockerfile), and everything else is service variables. Deploys are driven by GitHub Actions, **not** Railway's GitHub integration.

### Architecture

Two Railway services in one project:

1. **The app** — built from the root `Dockerfile`, stateless. Create it as an **empty service** and do _not_ connect the GitHub repo to it — that would turn on Railway's own autodeploys alongside the Actions workflow.
2. **libSQL Server** — deploy Railway's [libSQL Server template](https://railway.com/deploy/p121Tx) (a `sqld` instance with a volume at `/var/lib/sqld`). This is where the data lives, so app redeploys never touch it. Keep it off the public network, or set `SQLD_HTTP_AUTH` on it and `APL_DB_AUTH_TOKEN` on the app.

### App service variables

| Variable                | Used at                                                                    | Value                                                                           |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `VITE_APP_MAPBOX_TOKEN` | build (inlined into the client bundle) _and_ boot (varlock env validation) | the public `pk.*` Mapbox token; add the deployed URL to its URL restrictions    |
| `APL_DB_URL`            | runtime                                                                    | the libSQL service's private URL, e.g. `http://<service>.railway.internal:8080` |
| `APL_DB_AUTH_TOKEN`     | runtime                                                                    | only if the libSQL server requires auth                                         |

The server boots through `varlock run` (the `start` script), which validates [`.env.schema`](./.env.schema) against the container env and fails fast on a missing required variable. Drizzle migrations under `drizzle/` apply automatically at boot.

### GitHub Actions

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs the checks (typecheck, format, lint, tests) on every push to `main`, then uploads the repo with `railway up --ci` — Railway builds the Dockerfile and swaps deployments only if that build succeeds. One-time setup:

1. In Railway, create a **project token** (Project Settings → Tokens), scoped to the environment you deploy to.
2. In GitHub, add the token as the `RAILWAY_TOKEN` repository **secret**, and the app service's name or id as the `RAILWAY_SERVICE_ID` repository **variable**.

Manual deploys: trigger **Run workflow** (`workflow_dispatch`) in the Actions tab, or run `railway up` locally with the Railway CLI.

### Running the image locally

```sh
docker build --build-arg VITE_APP_MAPBOX_TOKEN="pk.…" -t apl-meeting-rooms .
docker run --rm -p 3000:3000 -e VITE_APP_MAPBOX_TOKEN="pk.…" apl-meeting-rooms
```

Without `APL_DB_URL` the container falls back to an ephemeral SQLite file inside the container — fine for poking around, gone when the container exits.
