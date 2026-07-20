import { and, desc, eq } from "drizzle-orm";

import type { Database } from "./client.server";

import {
    CancellationFailedError,
    ReservationNotFoundError,
    RoomAlreadyReservedError,
} from "../errors";
import {
    BranchCoordinates,
    BranchDirectory,
    Branches,
    OperatingHours,
    Reservations,
    RoomConflicts,
    Rooms,
    SpecialDates,
    SyncState,
    type Branch,
    type NewBranch,
    type NewBranchCoordinate,
    type NewBranchDirectoryEntry,
    type NewReservation,
    type NewRoom,
    type NewSpecialDate,
    type Reservation,
    type Room,
} from "./schema";

type RoomKind = Room["kind"];

/** Fields a caller supplies to book a room; `id`, `status`, and `createdAt` are managed by the repo. */
export type CreateReservationInput = Omit<NewReservation, "id" | "status" | "createdAt">;

/** Filters for {@link ReservationsRepo.list}. Omitted fields are unconstrained. */
export type ReservationFilter = {
    roomId?: string;
    date?: string;
    status?: Reservation["status"];
};

/**
 * libSQL surfaces a constraint breach as an Error whose message names the failure; Drizzle may wrap
 * it, so walk the `cause` chain rather than trusting the outermost message.
 */
function isUniqueViolation(error: unknown): boolean {
    for (let current: unknown = error; current instanceof Error; current = current.cause) {
        if (/UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(current.message)) return true;
    }
    return false;
}

const writeQueues = new WeakMap<Database, Promise<unknown>>();

/**
 * Runs `write` after every previously queued write on the same database handle. The local libSQL
 * driver runs each transaction on a dedicated connection with no busy timeout, so ANY write
 * overlapping an in-flight transaction — another transaction or a plain statement — aborts with
 * SQLITE_BUSY instead of waiting. Serializing all writes through one FIFO queue is the boring fix,
 * applied uniformly rather than per-driver so dev and deployed behavior match; reads stay
 * concurrent (WAL). Writes here are tiny (single upserts, wholesale replaces of small tables), so
 * throughput is a non-issue.
 */
function serializedWrite<T>(db: Database, write: () => Promise<T>): Promise<T> {
    const prior = writeQueues.get(db) ?? Promise.resolve();
    const run = prior.then(write);
    writeQueues.set(
        db,
        run.then(
            () => undefined,
            () => undefined,
        ),
    );
    return run;
}

/**
 * Persistence for app-owned reservations. Every reservation query lives here as a method rather than
 * as a free function, so callers reach it through `repos.reservations.*` and never thread a Drizzle
 * instance around.
 */
export class ReservationsRepo {
    constructor(private db: Database) {}

    /**
     * Books a room. The `uq_active_reservation_slot` partial unique index is the single arbiter of
     * "already taken": a clashing insert raises a UNIQUE violation, which we translate to
     * {@link RoomAlreadyReservedError}. There is no read-then-write window, so two concurrent bookings
     * of the same slot can't both succeed.
     */
    async create(input: CreateReservationInput): Promise<Reservation> {
        try {
            const created = await serializedWrite(this.db, () =>
                this.db
                    .insert(Reservations)
                    .values({ ...input, status: "confirmed", createdAt: new Date().toISOString() })
                    .returning()
                    .get(),
            );
            return created;
        } catch (error) {
            if (isUniqueViolation(error)) throw new RoomAlreadyReservedError();
            throw error;
        }
    }

    /** Looks up a reservation by id, throwing {@link ReservationNotFoundError} if absent. */
    async get(id: number): Promise<Reservation> {
        const row = await this.db.select().from(Reservations).where(eq(Reservations.id, id)).get();
        if (!row) throw new ReservationNotFoundError();
        return row;
    }

    /**
     * Cancels a confirmed reservation. Cancelling flips `status` to `cancelled`, which drops the row
     * out of the partial unique index and frees the slot for re-booking. The conditional update (only
     * when still `confirmed`) makes this safe under a concurrent cancel: the loser sees zero affected
     * rows and gets {@link CancellationFailedError}.
     */
    async cancel(id: number): Promise<Reservation> {
        const existing = await this.db
            .select()
            .from(Reservations)
            .where(eq(Reservations.id, id))
            .get();
        if (!existing) throw new ReservationNotFoundError();
        if (existing.status === "cancelled") throw new CancellationFailedError();

        const cancelled = await serializedWrite(this.db, () =>
            this.db
                .update(Reservations)
                .set({ status: "cancelled" })
                .where(and(eq(Reservations.id, id), eq(Reservations.status, "confirmed")))
                .returning()
                .get(),
        );

        if (!cancelled) throw new CancellationFailedError(); // lost the race to another cancel
        return cancelled;
    }

    /** Lists reservations (newest first) matching the optional filter. */
    async list(filter: ReservationFilter = {}): Promise<Reservation[]> {
        const conditions = [
            filter.roomId !== undefined ? eq(Reservations.roomId, filter.roomId) : undefined,
            filter.date !== undefined ? eq(Reservations.date, filter.date) : undefined,
            filter.status !== undefined ? eq(Reservations.status, filter.status) : undefined,
        ].filter(condition => condition !== undefined);

        return this.db
            .select()
            .from(Reservations)
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(Reservations.id))
            .all();
    }
}

const SYNC_TTL_MS = 5 * 60 * 1000;

/**
 * Per-source freshness watermark — the read-through TTL the blob cache's `fetchedAt` used to provide.
 * `isFresh(source)` answers "did we sync this source within the TTL?"; `touch(source)` records a sync.
 */
export class SyncStateRepo {
    constructor(private db: Database) {}

    async isFresh(source: string, ttlMs = SYNC_TTL_MS): Promise<boolean> {
        const row = await this.db
            .select({ syncedAt: SyncState.syncedAt })
            .from(SyncState)
            .where(eq(SyncState.source, source))
            .get();
        if (!row) return false;
        const age = Date.now() - Date.parse(row.syncedAt);
        return Number.isFinite(age) && age >= 0 && age < ttlMs;
    }

    async touch(source: string): Promise<void> {
        const syncedAt = new Date().toISOString();
        await serializedWrite(this.db, () =>
            this.db
                .insert(SyncState)
                .values({ source, syncedAt })
                .onConflictDoUpdate({ target: SyncState.source, set: { syncedAt } })
                .run(),
        );
    }

    /** Forgets every watermark, forcing all sources to re-scrape on next access. */
    async clear(): Promise<void> {
        await serializedWrite(this.db, () => this.db.delete(SyncState).run());
    }
}

/**
 * Scraped rooms — the single source of truth for branch availability aggregates. A sync fully replaces
 * the set for a given kind (rooms can disappear upstream), so `replaceByKind` is delete-then-insert in
 * one transaction.
 */
export class RoomsRepo {
    constructor(private db: Database) {}

    async replaceByKind(kind: RoomKind, rows: NewRoom[]): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(Rooms).where(eq(Rooms.kind, kind)).run();
                if (rows.length) await tx.insert(Rooms).values(rows).run();
            }),
        );
    }

    async listByKind(kind: RoomKind): Promise<Room[]> {
        return this.db.select().from(Rooms).where(eq(Rooms.kind, kind)).all();
    }
}

/**
 * Branches keyed by location_id. `name` is upserted from scraped option labels; `path` is seeded from
 * the static mapping. Each upsert touches only its own columns, so the two sources merge without clobber.
 */
export class BranchesRepo {
    constructor(private db: Database) {}

    /** Upserts branch display names (leaves `path` untouched). */
    async upsertNames(rows: Array<{ locationId: string; name: string }>): Promise<void> {
        const syncedAt = new Date().toISOString();
        await serializedWrite(this.db, async () => {
            for (const row of rows) {
                await this.db
                    .insert(Branches)
                    .values({ locationId: row.locationId, name: row.name, syncedAt })
                    .onConflictDoUpdate({
                        target: Branches.locationId,
                        set: { name: row.name, syncedAt },
                    })
                    .run();
            }
        });
    }

    /** Seeds location-page paths (leaves `name`/`synced_at` untouched). */
    async seedPaths(pathByLocationId: Record<string, string>): Promise<void> {
        await serializedWrite(this.db, async () => {
            for (const [locationId, path] of Object.entries(pathByLocationId)) {
                await this.db
                    .insert(Branches)
                    .values({ locationId, path } satisfies NewBranch)
                    .onConflictDoUpdate({ target: Branches.locationId, set: { path } })
                    .run();
            }
        });
    }

    async list(): Promise<Branch[]> {
        return this.db.select().from(Branches).all();
    }

    /** location_id → location-page path, for `apl.getLocationPathMapping`. */
    async pathMap(): Promise<Record<string, string>> {
        const rows = await this.db
            .select({ locationId: Branches.locationId, path: Branches.path })
            .from(Branches)
            .all();
        const mapping: Record<string, string> = {};
        for (const row of rows) {
            if (row.path) mapping[row.locationId] = row.path;
        }
        return mapping;
    }
}

/** Name-keyed external feed (address / image / page path), replaced wholesale on each sync. */
export class BranchDirectoryRepo {
    constructor(private db: Database) {}

    async replaceAll(rows: NewBranchDirectoryEntry[]): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(BranchDirectory).run();
                if (rows.length) await tx.insert(BranchDirectory).values(rows).run();
            }),
        );
    }

    async list() {
        return this.db.select().from(BranchDirectory).all();
    }
}

/** Name-keyed map coordinates, replaced wholesale on each sync. */
export class BranchCoordinatesRepo {
    constructor(private db: Database) {}

    async replaceAll(rows: NewBranchCoordinate[]): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(BranchCoordinates).run();
                if (rows.length) await tx.insert(BranchCoordinates).values(rows).run();
            }),
        );
    }

    async list() {
        return this.db.select().from(BranchCoordinates).all();
    }
}

/** Calendar exceptions, replaced wholesale on each sync. */
export class SpecialDatesRepo {
    constructor(private db: Database) {}

    async replaceAll(rows: NewSpecialDate[]): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(SpecialDates).run();
                if (rows.length) await tx.insert(SpecialDates).values(rows).run();
            }),
        );
    }

    async list() {
        return this.db.select().from(SpecialDates).all();
    }
}

/** SLR operating hours, seeded from code constants (the availability functions still read the constants). */
export class OperatingHoursRepo {
    constructor(private db: Database) {}

    async replaceAll(rows: Array<typeof OperatingHours.$inferInsert>): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(OperatingHours).run();
                if (rows.length) await tx.insert(OperatingHours).values(rows).run();
            }),
        );
    }
}

/** Combined-room conflict graph, seeded from code constants. */
export class RoomConflictsRepo {
    constructor(private db: Database) {}

    async replaceAll(rows: Array<typeof RoomConflicts.$inferInsert>): Promise<void> {
        await serializedWrite(this.db, () =>
            this.db.transaction(async tx => {
                await tx.delete(RoomConflicts).run();
                if (rows.length) await tx.insert(RoomConflicts).values(rows).run();
            }),
        );
    }
}
