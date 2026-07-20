import { describe, expect, it } from "vitest";

import { createDatabase, type Database } from "./client.server";

// These tests guard the bootstrap itself: that the committed drizzle migration, applied at runtime by
// the libSQL migrator, produces the schema `schema.ts` describes. They catch migration/schema
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
async function appTableNames(db: Database): Promise<string[]> {
    const result = await db.$client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' " +
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'",
    );
    return result.rows.map(row => row.name as string).sort();
}

describe("database bootstrap / migration", () => {
    it("creates exactly the expected application tables", async () => {
        expect(await appTableNames(await createDatabase(":memory:"))).toEqual(EXPECTED_TABLES);
    });

    it("creates the named indexes, and the reservation-slot index is PARTIAL", async () => {
        const db = await createDatabase(":memory:");
        const result = await db.$client.execute(
            "SELECT name, sql FROM sqlite_master WHERE type='index'",
        );
        const byName = new Map(
            result.rows.map(index => [index.name as string, index.sql as string | null]),
        );

        expect(byName.has("uq_active_reservation_slot")).toBe(true);
        expect(byName.has("ix_rooms_kind_location")).toBe(true);
        // The slot index only constrains confirmed rows — that's what lets a cancelled slot be re-booked.
        expect(byName.get("uq_active_reservation_slot")).toMatch(/where/i);
        expect(byName.get("uq_active_reservation_slot")).toContain("confirmed");
    });

    it("enables the foreign_keys pragma", async () => {
        const db = await createDatabase(":memory:");
        const row = (await db.$client.execute("PRAGMA foreign_keys")).rows[0];
        expect(Number(row.foreign_keys)).toBe(1);
    });

    it("applies room column defaults (booleans default 0; unset nullable columns stay null)", async () => {
        const db = await createDatabase(":memory:");
        await db.$client.execute(
            "INSERT INTO rooms (room_id, location_id, kind, synced_at) " +
                "VALUES ('x', '1', 'meeting-room', 't')",
        );
        const row = (
            await db.$client.execute(
                "SELECT published, airplay, hdmi, whiteboard, capacity, floor FROM rooms WHERE room_id='x'",
            )
        ).rows[0];

        expect(Number(row.published)).toBe(0);
        expect(Number(row.airplay)).toBe(0);
        expect(Number(row.hdmi)).toBe(0);
        expect(Number(row.whiteboard)).toBe(0);
        expect(row.capacity).toBeNull();
        expect(row.floor).toBeNull();
    });

    it("defaults a reservation's status to 'confirmed'", async () => {
        const db = await createDatabase(":memory:");
        await db.$client.execute(
            "INSERT INTO reservations " +
                "(room_id, room_kind, room_name, branch_name, meeting_topic, full_name, email_address, date, time, created_at) " +
                "VALUES ('781', 'meeting-room', 'A', 'Central', 'Topic', 'Ada', 'a@e.com', '2026-06-25', '5:00 PM', 't')",
        );
        const row = (await db.$client.execute("SELECT status FROM reservations LIMIT 1")).rows[0];
        expect(row.status).toBe("confirmed");
    });

    it("builds independent databases deterministically", async () => {
        expect(await appTableNames(await createDatabase(":memory:"))).toEqual(
            await appTableNames(await createDatabase(":memory:")),
        );
    });
});
