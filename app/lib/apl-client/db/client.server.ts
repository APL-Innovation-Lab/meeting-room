import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

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

const DEFAULT_DB_PATH = "data/apl.db";
const MIGRATIONS_FOLDER = "drizzle";

export type Database = ReturnType<typeof createDatabase>;

/**
 * Opens a SQLite database, applies any pending migrations, and returns the Drizzle handle plus the
 * raw client. Pass `":memory:"` for an ephemeral, isolated database (tests); any other value is a
 * filesystem path that persists across restarts — required now that the app owns reservation data.
 *
 * Migrations are applied from the committed `./drizzle` folder via the node:sqlite migrator, so the
 * schema in `schema.ts` is the single source of truth (no hand-maintained DDL).
 */
export function createDatabase(path = DEFAULT_DB_PATH) {
    if (path !== ":memory:") {
        // node:sqlite creates the database file but not its parent directory.
        mkdirSync(dirname(path), { recursive: true });
    }

    const client = new DatabaseSync(path);
    client.exec("PRAGMA foreign_keys = ON;");
    if (path !== ":memory:") {
        client.exec("PRAGMA journal_mode = WAL;");
    }

    const db = drizzle({ client, schema });
    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    return db;
}

let singleton: Database | undefined;

/**
 * The process-wide, file-backed database handle, created lazily on first use. Lazy (rather than a
 * top-level `const`) so that importing this module in a test — to grab `createDatabase(":memory:")` —
 * does not, as a side effect, open and migrate the real on-disk database.
 */
export function getDb(): Database {
    singleton ??= createDatabase();
    return singleton;
}

/**
 * Unified repository container. Owns no queries itself — it binds every entity repository to a single
 * database handle so callers reach persistence through `repos.reservations.*` (and future
 * `repos.rooms.*`, etc.) instead of importing free functions and threading a Drizzle instance around.
 *
 * Defaults to the lazy file-backed database; pass an explicit handle (e.g. `createDatabase(":memory:")`)
 * to scope a container to an isolated database, as the tests do.
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

    constructor(db: Database = getDb()) {
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

let singletonRepos: Repos | undefined;

/** The process-wide repositories, backed by the lazy file-backed database. */
export function getRepos(): Repos {
    singletonRepos ??= new Repos();
    return singletonRepos;
}
