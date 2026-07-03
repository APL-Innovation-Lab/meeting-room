import { describe, expect, it } from "vitest";

import { createDatabase, type Database } from "./client.server";

// These tests guard the bootstrap itself: that the committed drizzle migration, applied at runtime by
// the node:sqlite migrator, produces the schema `schema.ts` describes. They catch migration/schema
// drift — e.g. forgetting to run `db:generate` after editing the schema — which the higher-level repo
// tests would not surface clearly.

const EXPECTED_TABLES = [
    "branch_coordinates",
    "branch_directory",
    "branches",
    "operating_hours",
    "reservations",
    "room_conflicts",
    "rooms",
    "special_dates",
    "sync_state",
].sort();

/** Application tables only — excludes SQLite internals and the migrator's bookkeeping table. */
function appTableNames(db: Database): string[] {
    const rows = db.$client
        .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' " +
                "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'",
        )
        .all() as Array<{ name: string }>;
    return rows.map(row => row.name).sort();
}

describe("database bootstrap / migration", () => {
    it("creates exactly the expected application tables", () => {
        expect(appTableNames(createDatabase(":memory:"))).toEqual(EXPECTED_TABLES);
    });

    it("creates the named indexes, and the reservation-slot index is PARTIAL", () => {
        const indexes = createDatabase(":memory:")
            .$client.prepare("SELECT name, sql FROM sqlite_master WHERE type='index'")
            .all() as Array<{ name: string; sql: string | null }>;
        const byName = new Map(indexes.map(index => [index.name, index.sql]));

        expect(byName.has("uq_active_reservation_slot")).toBe(true);
        expect(byName.has("ix_rooms_kind_location")).toBe(true);
        // The slot index only constrains confirmed rows — that's what lets a cancelled slot be re-booked.
        expect(byName.get("uq_active_reservation_slot")).toMatch(/where/i);
        expect(byName.get("uq_active_reservation_slot")).toContain("confirmed");
    });

    it("enables the foreign_keys pragma", () => {
        const row = createDatabase(":memory:").$client.prepare("PRAGMA foreign_keys").get() as {
            foreign_keys: number;
        };
        expect(row.foreign_keys).toBe(1);
    });

    it("applies room column defaults (booleans default 0; unset nullable columns stay null)", () => {
        const db = createDatabase(":memory:");
        db.$client.exec(
            "INSERT INTO rooms (room_id, location_id, kind, synced_at) " +
                "VALUES ('x', '1', 'meeting-room', 't')",
        );
        const row = db.$client
            .prepare(
                "SELECT published, airplay, hdmi, whiteboard, capacity, floor FROM rooms WHERE room_id='x'",
            )
            .get() as Record<string, number | null>;

        expect(row.published).toBe(0);
        expect(row.airplay).toBe(0);
        expect(row.hdmi).toBe(0);
        expect(row.whiteboard).toBe(0);
        expect(row.capacity).toBeNull();
        expect(row.floor).toBeNull();
    });

    it("defaults a reservation's status to 'confirmed'", () => {
        const db = createDatabase(":memory:");
        db.$client.exec(
            "INSERT INTO reservations " +
                "(room_id, room_kind, room_name, branch_name, meeting_topic, full_name, email_address, date, time, created_at) " +
                "VALUES ('781', 'meeting-room', 'A', 'Central', 'Topic', 'Ada', 'a@e.com', '2026-06-25', '5:00 PM', 't')",
        );
        const row = db.$client.prepare("SELECT status FROM reservations LIMIT 1").get() as {
            status: string;
        };
        expect(row.status).toBe("confirmed");
    });

    it("builds independent databases deterministically", () => {
        expect(appTableNames(createDatabase(":memory:"))).toEqual(
            appTableNames(createDatabase(":memory:")),
        );
    });
});
