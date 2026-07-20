import { defineConfig } from "drizzle-kit";

// Schema is the single source of truth. `drizzle-kit generate` diffs it into SQL migrations under
// ./drizzle, which are applied at runtime by the libSQL migrator (see db/client.server.ts).
// `dbCredentials` is only consulted by `push`/`studio`; `generate` is an offline schema diff.
export default defineConfig({
    dialect: "sqlite",
    schema: "./app/lib/apl-client/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.APL_DB_URL || "file:data/apl.db",
    },
});
