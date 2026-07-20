import { sql } from "drizzle-orm";
import {
    index,
    integer,
    primaryKey,
    real,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * The native relational schema for the APL meeting-room app. This replaces the opaque KV blob store:
 * the domain entities the live client works with — branches, rooms, their conflict graph, operating
 * hours, special dates, and (app-owned) reservations — are modeled as typed, queryable, related
 * tables rather than JSON packed into a `value` column.
 *
 * Provenance classes:
 *   - Scraped read-model, keyed by `location_id` (`branches`, `rooms`): upserted from the live site,
 *     each carries `synced_at`. The branch *view-models* the UI consumes (per-location capacities /
 *     rooms-available) are DERIVED from `rooms` by query — there is no stored aggregate.
 *   - Scraped read-model, keyed by branch *name* (`branch_directory`, `branch_coordinates`): separate
 *     external feeds the UI reconciles to locations by fuzzy name match, so they keep their name key.
 *   - Static domain logic mirrored into tables (`room_conflicts`, `operating_hours`): seeded from code
 *     constants; the (pure, tested) availability functions still read the constants for now.
 *   - Sync bookkeeping (`sync_state`): per-source freshness watermark — the read-through TTL that the
 *     blob cache's `fetchedAt` used to provide.
 *   - App-owned transactional data (`reservations`) — created, constrained, and cancelled by THIS app.
 */

const ROOM_KINDS = ["meeting-room", "shared-learning-room"] as const;

/**
 * Library branches / locations, keyed by APL `location_id`. `name` comes from scraped option labels;
 * `path` is the location-page path (seeded from the static mapping). Both are nullable because a row
 * can exist as a path-only seed stub before a scrape fills in the name (and vice versa).
 */
export const Branches = sqliteTable("branches", {
    locationId: text("location_id").primaryKey(),
    name: text("name"),
    /** Location page path on the live site (e.g. `/carver-branch`), keyed by location_id. */
    path: text("path"),
    syncedAt: text("synced_at"),
});

/**
 * Bookable rooms — the single source of truth for branch availability aggregates. `location_id` is an
 * indexed plain column (no FK): rooms and branches are scraped from independent sources at different
 * times, so a hard FK would only couple their write ordering. Meeting rooms carry less metadata than
 * SLR rooms, hence the nullable columns.
 */
export const Rooms = sqliteTable(
    "rooms",
    {
        roomId: text("room_id").primaryKey(),
        locationId: text("location_id").notNull(),
        kind: text("kind", { enum: ROOM_KINDS }).notNull(),
        name: text("name"),
        capacity: integer("capacity"),
        floor: integer("floor"),
        image: text("image"),
        published: integer("published", { mode: "boolean" }).notNull().default(false),
        airplay: integer("airplay", { mode: "boolean" }).notNull().default(false),
        hdmi: integer("hdmi", { mode: "boolean" }).notNull().default(false),
        whiteboard: integer("whiteboard", { mode: "boolean" }).notNull().default(false),
        syncedAt: text("synced_at").notNull(),
    },
    table => [index("ix_rooms_kind_location").on(table.kind, table.locationId)],
);

/**
 * Branch directory entries (address / image / location-page path), keyed by branch *name* — a feed
 * the UI reconciles to locations by fuzzy name match, so it is not joined to `location_id` here.
 */
export const BranchDirectory = sqliteTable("branch_directory", {
    branchName: text("branch_name").primaryKey(),
    address: text("address"),
    image: text("image"),
    path: text("path"),
    syncedAt: text("synced_at").notNull(),
});

/** Branch map coordinates from the KML feed, keyed by branch *name* (same name-reconciliation reason). */
export const BranchCoordinates = sqliteTable("branch_coordinates", {
    branchName: text("branch_name").primaryKey(),
    lng: real("lng").notNull(),
    lat: real("lat").notNull(),
    syncedAt: text("synced_at").notNull(),
});

/**
 * The combined-room conflict graph: booking `room_id` also blocks every `conflicts_with` room (e.g. a
 * partitioned room and its two halves). Stored as directed edges so the lookup is a single indexed read.
 */
export const RoomConflicts = sqliteTable(
    "room_conflicts",
    {
        roomId: text("room_id").notNull(),
        conflictsWith: text("conflicts_with").notNull(),
    },
    table => [primaryKey({ columns: [table.roomId, table.conflictsWith] })],
);

/** Per-location, per-weekday SLR operating hours (minutes since midnight; null = closed that day). */
export const OperatingHours = sqliteTable(
    "operating_hours",
    {
        locationId: text("location_id").notNull(),
        weekday: integer("weekday").notNull(), // 0=Sun .. 6=Sat (UTC calendar weekday)
        openingMinute: integer("opening_minute"),
        closingMinute: integer("closing_minute"),
    },
    table => [primaryKey({ columns: [table.locationId, table.weekday] })],
);

/** Calendar exceptions: a date is either fully `closed` or has an `early_close_minute`. */
export const SpecialDates = sqliteTable("special_dates", {
    date: text("date").primaryKey(), // YYYY-MM-DD
    closed: integer("closed", { mode: "boolean" }).notNull().default(false),
    earlyCloseMinute: integer("early_close_minute"),
    syncedAt: text("synced_at").notNull(),
});

/** Per-source freshness watermark: the read-through TTL that replaces the blob cache's `fetchedAt`. */
export const SyncState = sqliteTable("sync_state", {
    source: text("source").primaryKey(),
    syncedAt: text("synced_at").notNull(),
});

/**
 * App-owned reservations. The partial unique index enforces "one active booking per room/date/slot"
 * at the database level — this is what powers {@link RoomAlreadyReservedError} without a read-modify-write
 * race. Cancelling flips `status` to `cancelled`, which drops the row out of the partial index and frees
 * the slot for re-booking.
 *
 * Room facts (`room_name`, `branch_name`, `branch_address`, `capacity`) and the booked window are
 * snapshotted at booking time so the confirmation page renders from this row alone, with no live
 * upstream lookup. The column defaults exist only to backfill rows created before the columns did.
 */
export const Reservations = sqliteTable(
    "reservations",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        roomId: text("room_id").notNull(),
        roomKind: text("room_kind", { enum: ROOM_KINDS }).notNull(),
        roomName: text("room_name").notNull(),
        branchName: text("branch_name").notNull(),
        branchAddress: text("branch_address").notNull().default(""),
        capacity: integer("capacity").notNull().default(0),
        meetingTopic: text("meeting_topic").notNull(),
        fullName: text("full_name").notNull(),
        emailAddress: text("email_address").notNull(),
        date: text("date").notNull(), // YYYY-MM-DD
        time: text("time").notNull(), // slot label, e.g. "5:00 PM"
        durationMinutes: integer("duration_minutes").notNull().default(120),
        // Meeting-room-only fields (null for shared-learning rooms).
        orgName: text("org_name"),
        orgPurpose: text("org_purpose"),
        website: text("website"),
        phoneNumber: text("phone_number"),
        status: text("status", { enum: ["confirmed", "cancelled"] })
            .notNull()
            .default("confirmed"),
        createdAt: text("created_at").notNull(),
    },
    table => [
        uniqueIndex("uq_active_reservation_slot")
            .on(table.roomId, table.date, table.time)
            .where(sql`${table.status} = 'confirmed'`),
    ],
);

export type Branch = typeof Branches.$inferSelect;
export type NewBranch = typeof Branches.$inferInsert;
export type Room = typeof Rooms.$inferSelect;
export type NewRoom = typeof Rooms.$inferInsert;
export type NewBranchDirectoryEntry = typeof BranchDirectory.$inferInsert;
export type NewBranchCoordinate = typeof BranchCoordinates.$inferInsert;
export type NewSpecialDate = typeof SpecialDates.$inferInsert;
export type Reservation = typeof Reservations.$inferSelect;
export type NewReservation = typeof Reservations.$inferInsert;
