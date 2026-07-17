import { beforeEach, describe, expect, it } from "vitest";

import type { NewRoom } from "./schema";

import { createDatabase, Repos, type Database } from "./client.server";

// Unit tests for the scraped-entity repos (slice 2). They back the live client's read-through cache,
// so their correctness — full-replace semantics, transactional rollback, type round-tripping, and the
// freshness watermark — is what keeps the search page consistent.

let db: Database;
let repos: Repos;
beforeEach(() => {
    db = createDatabase(":memory:");
    repos = new Repos(db);
});

const now = () => new Date().toISOString();
const room = (roomId: string, over: Partial<NewRoom> = {}): NewRoom => ({
    roomId,
    locationId: "194",
    kind: "shared-learning-room",
    capacity: 4,
    published: true,
    airplay: false,
    hdmi: false,
    whiteboard: false,
    syncedAt: now(),
    ...over,
});

describe("RoomsRepo", () => {
    it("inserts and lists rows, round-tripping booleans", () => {
        repos.rooms.replaceByKind("shared-learning-room", [
            room("r1", { published: true, whiteboard: true, hdmi: false }),
        ]);
        const [r] = repos.rooms.listByKind("shared-learning-room");
        expect(r.published).toBe(true);
        expect(r.whiteboard).toBe(true);
        expect(r.hdmi).toBe(false);
    });

    it("fully replaces the set for a kind (not append)", () => {
        repos.rooms.replaceByKind("shared-learning-room", [room("r1"), room("r2")]);
        repos.rooms.replaceByKind("shared-learning-room", [room("r3")]);
        expect(repos.rooms.listByKind("shared-learning-room").map(r => r.roomId)).toEqual(["r3"]);
    });

    it("isolates kinds — replacing one never touches the other", () => {
        repos.rooms.replaceByKind("shared-learning-room", [room("s1")]);
        repos.rooms.replaceByKind("meeting-room", [room("m1", { kind: "meeting-room" })]);
        repos.rooms.replaceByKind("shared-learning-room", []);
        expect(repos.rooms.listByKind("shared-learning-room")).toHaveLength(0);
        expect(repos.rooms.listByKind("meeting-room")).toHaveLength(1);
    });

    it("round-trips null capacity/floor (meeting rooms carry less metadata)", () => {
        repos.rooms.replaceByKind("meeting-room", [
            room("m1", { kind: "meeting-room", capacity: null, floor: null }),
        ]);
        const [r] = repos.rooms.listByKind("meeting-room");
        expect(r.capacity).toBeNull();
        expect(r.floor).toBeNull();
    });

    it("rolls back atomically when the replacement set violates a constraint", () => {
        repos.rooms.replaceByKind("meeting-room", [room("keep", { kind: "meeting-room" })]);
        // Two rows sharing a primary key → UNIQUE violation midway through the insert.
        expect(() =>
            repos.rooms.replaceByKind("meeting-room", [
                room("dup", { kind: "meeting-room" }),
                room("dup", { kind: "meeting-room" }),
            ]),
        ).toThrow();
        // delete-then-insert is one transaction, so the failed replace left the original row intact.
        expect(repos.rooms.listByKind("meeting-room").map(r => r.roomId)).toEqual(["keep"]);
    });
});

describe("BranchesRepo", () => {
    it("merges name and path from independent sources without clobbering (either order)", () => {
        repos.branches.seedPaths({ "194": "/carver-branch" });
        repos.branches.upsertNames([{ locationId: "194", name: "Carver Branch" }]);
        let b = repos.branches.list().find(x => x.locationId === "194");
        expect(b?.name).toBe("Carver Branch");
        expect(b?.path).toBe("/carver-branch");

        // Reverse order on a second location — names first, then paths.
        repos.branches.upsertNames([{ locationId: "205", name: "Ruiz Branch" }]);
        repos.branches.seedPaths({ "205": "/ruiz-branch" });
        b = repos.branches.list().find(x => x.locationId === "205");
        expect(b?.name).toBe("Ruiz Branch");
        expect(b?.path).toBe("/ruiz-branch");
    });

    it("updates the name on a repeat upsert", () => {
        repos.branches.upsertNames([{ locationId: "194", name: "Old Name" }]);
        repos.branches.upsertNames([{ locationId: "194", name: "New Name" }]);
        expect(repos.branches.list().find(b => b.locationId === "194")?.name).toBe("New Name");
    });

    it("pathMap returns only branches that have a path", () => {
        repos.branches.seedPaths({ "194": "/carver-branch" });
        repos.branches.upsertNames([{ locationId: "999", name: "No Path Branch" }]);
        const map = repos.branches.pathMap();
        expect(map["194"]).toBe("/carver-branch");
        expect(map["999"]).toBeUndefined();
    });
});

describe("SyncStateRepo", () => {
    it("is not fresh before a touch, fresh after", () => {
        expect(repos.syncState.isFresh("s")).toBe(false);
        repos.syncState.touch("s");
        expect(repos.syncState.isFresh("s")).toBe(true);
    });

    it("respects the TTL boundary", () => {
        repos.syncState.touch("s");
        expect(repos.syncState.isFresh("s", -1)).toBe(false); // any age exceeds a negative TTL
        expect(repos.syncState.isFresh("s", 60_000)).toBe(true);
    });

    it("clear() forgets every watermark", () => {
        repos.syncState.touch("a");
        repos.syncState.touch("b");
        repos.syncState.clear();
        expect(repos.syncState.isFresh("a")).toBe(false);
        expect(repos.syncState.isFresh("b")).toBe(false);
    });
});

describe("SpecialDatesRepo", () => {
    it("round-trips closed dates and early closings (incl. null early-close)", () => {
        repos.specialDates.replaceAll([
            { date: "2026-07-04", closed: true, earlyCloseMinute: null, syncedAt: now() },
            { date: "2026-12-24", closed: false, earlyCloseMinute: 17 * 60, syncedAt: now() },
        ]);
        const rows = repos.specialDates.list();
        expect(rows).toHaveLength(2);

        const closed = rows.find(r => r.date === "2026-07-04");
        expect(closed?.closed).toBe(true);
        expect(closed?.earlyCloseMinute).toBeNull();
        expect(rows.find(r => r.date === "2026-12-24")?.earlyCloseMinute).toBe(17 * 60);
    });

    it("replaceAll([]) clears the table", () => {
        repos.specialDates.replaceAll([
            { date: "2026-07-04", closed: true, earlyCloseMinute: null, syncedAt: now() },
        ]);
        repos.specialDates.replaceAll([]);
        expect(repos.specialDates.list()).toHaveLength(0);
    });
});

describe("BranchDirectoryRepo / BranchCoordinatesRepo", () => {
    it("directory round-trips and replaces wholesale (incl. null fields)", () => {
        repos.branchDirectory.replaceAll([
            {
                branchName: "Carver",
                address: "1161 Angelina",
                image: "/i.jpg",
                path: "/carver",
                syncedAt: now(),
            },
        ]);
        expect(repos.branchDirectory.list()).toHaveLength(1);

        repos.branchDirectory.replaceAll([
            { branchName: "Ruiz", address: null, image: null, path: null, syncedAt: now() },
        ]);
        const rows = repos.branchDirectory.list();
        expect(rows.map(r => r.branchName)).toEqual(["Ruiz"]);
        expect(rows[0].address).toBeNull();
    });

    it("coordinates round-trip lng/lat", () => {
        repos.branchCoordinates.replaceAll([
            { branchName: "Central", lng: -97.7, lat: 30.27, syncedAt: now() },
        ]);
        const [c] = repos.branchCoordinates.list();
        expect(c.lng).toBeCloseTo(-97.7);
        expect(c.lat).toBeCloseTo(30.27);
    });
});

describe("OperatingHoursRepo / RoomConflictsRepo (seed targets)", () => {
    it("operating hours round-trip, including null (closed) days", () => {
        repos.operatingHours.replaceAll([
            { locationId: "194", weekday: 1, openingMinute: 540, closingMinute: 900 },
            { locationId: "194", weekday: 0, openingMinute: null, closingMinute: null },
        ]);
        const rows = db.$client
            .prepare(
                "SELECT weekday, opening_minute AS o, closing_minute AS c FROM operating_hours " +
                    "WHERE location_id='194' ORDER BY weekday",
            )
            .all() as Array<{ weekday: number; o: number | null; c: number | null }>;
        expect(rows).toEqual([
            { weekday: 0, o: null, c: null },
            { weekday: 1, o: 540, c: 900 },
        ]);
    });

    it("room conflicts round-trip and replaceAll([]) clears", () => {
        repos.roomConflicts.replaceAll([
            { roomId: "781", conflictsWith: "848" },
            { roomId: "848", conflictsWith: "781" },
        ]);
        const count = () =>
            (db.$client.prepare("SELECT count(*) AS n FROM room_conflicts").get() as { n: number })
                .n;
        expect(count()).toBe(2);

        repos.roomConflicts.replaceAll([]);
        expect(count()).toBe(0);
    });
});
