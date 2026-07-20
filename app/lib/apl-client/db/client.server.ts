import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
    BranchCoordinatesRepo,
    BranchDirectoryRepo,
    BranchesRepo,
    OperatingHoursRepo,
    ReservationsRepo,
    RoomConflictsRepo,
    RoomsRepo,
    SpecialDatesRepo,
    SyncStateRepo,
} from "./repos";
import * as schema from "./schema";

const DEFAULT_DB_URL = "file:data/apl.db";
const MIGRATIONS_FOLDER = "drizzle";

/** The Drizzle handle every repo runs queries through, with the raw libSQL client at `$client`. */
export type Database = LibSQLDatabase<typeof schema> & { $client: Client };

/**
 * Opens a libSQL database, applies any pending migrations, and returns the Drizzle handle plus the
 * raw client. Accepts any libSQL URL: `":memory:"` for an ephemeral, isolated database (tests),
 * realized as a unique temp file — see below,
 * `file:<path>` for a persistent local file, or `http(s)://`/`libsql://` for a remote libSQL
 * server (`APL_DB_AUTH_TOKEN` is sent along when set).
 *
 * The default URL comes from `APL_DB_URL` — a deployed app points this at a libSQL server (e.g.
 * `http://<sqld-host>:8080` on Railway's private network) — falling back to the local dev file.
 * Read at runtime, not build time, so the deploy environment decides where data lives. Empty
 * means unset: varlock injects declared-but-blank vars as `""`.
 *
 * Migrations are applied from the committed `./drizzle` folder via the libSQL migrator, so the
 * schema in `schema.ts` is the single source of truth (no hand-maintained DDL).
 */
export async function createDatabase(
    url: string = process.env.APL_DB_URL || DEFAULT_DB_URL,
): Promise<Database> {
    if (url === ":memory:") {
        // Not a literal SQLite ":memory:" database: @libsql/client's local driver reopens the
        // database per transaction, so a plain in-memory database comes back empty after the first
        // BEGIN, and its only escape hatch (`file::memory:?cache=shared`) is one process-wide
        // database with no isolation between callers. A unique temp file keeps ":memory:"'s
        // isolation contract with real SQLite semantics.
        url = `file:${join(mkdtempSync(join(tmpdir(), "apl-db-")), "ephemeral.db")}`;
    } else if (url.startsWith("file:")) {
        // libSQL creates the database file but not its parent directory.
        mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
    }

    const client = createClient({ url, authToken: process.env.APL_DB_AUTH_TOKEN || undefined });
    if (url.startsWith("file:")) {
        // Connection-scoped pragmas apply only to a local database we own outright; a remote
        // libSQL server manages its own journal mode and connection settings.
        await client.execute("PRAGMA foreign_keys = ON;");
        await client.execute("PRAGMA journal_mode = WAL;");
    }

    const db = drizzle({ client, schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    return db;
}

let singleton: Promise<Database> | undefined;

/**
 * The process-wide database handle, created lazily on first use. Lazy (rather than a top-level
 * `const`) so that importing this module in a test — to grab `createDatabase(":memory:")` — does
 * not, as a side effect, open and migrate the real database. Memoizes the promise, not the value,
 * so concurrent first callers share one open+migrate.
 */
export function getDb(): Promise<Database> {
    singleton ??= createDatabase();
    return singleton;
}

/**
 * Unified repository container. Owns no queries itself — it binds every entity repository to a single
 * database handle so callers reach persistence through `repos.reservations.*` (and future
 * `repos.rooms.*`, etc.) instead of importing free functions and threading a Drizzle instance around.
 *
 * Takes a resolved database handle; use `getRepos()` for the process-wide container, or pass
 * `await createDatabase(":memory:")` to scope a container to an isolated database, as the tests do.
 */
export class Repos {
    readonly reservations: ReservationsRepo;
    readonly rooms: RoomsRepo;
    readonly branches: BranchesRepo;
    readonly branchDirectory: BranchDirectoryRepo;
    readonly branchCoordinates: BranchCoordinatesRepo;
    readonly specialDates: SpecialDatesRepo;
    readonly operatingHours: OperatingHoursRepo;
    readonly roomConflicts: RoomConflictsRepo;
    readonly syncState: SyncStateRepo;

    constructor(db: Database) {
        this.reservations = new ReservationsRepo(db);
        this.rooms = new RoomsRepo(db);
        this.branches = new BranchesRepo(db);
        this.branchDirectory = new BranchDirectoryRepo(db);
        this.branchCoordinates = new BranchCoordinatesRepo(db);
        this.specialDates = new SpecialDatesRepo(db);
        this.operatingHours = new OperatingHoursRepo(db);
        this.roomConflicts = new RoomConflictsRepo(db);
        this.syncState = new SyncStateRepo(db);
    }
}

let singletonRepos: Promise<Repos> | undefined;

/** The process-wide repositories, backed by the lazy database. */
export function getRepos(): Promise<Repos> {
    singletonRepos ??= getDb().then(db => new Repos(db));
    return singletonRepos;
}
