import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Back the scraper's getRepos() with an isolated in-memory database for the whole file. The hoisted
// holder is filled in beforeAll (vi.mock factories are hoisted above imports, so they can't close
// over a normal top-level let).
const hoisted = vi.hoisted(() => ({ repos: undefined as unknown }));

vi.mock("./db/client.server", async importOriginal => {
    const actual = await importOriginal<typeof import("./db/client.server")>();
    return { ...actual, getRepos: () => hoisted.repos };
});

import { createDatabase, Repos } from "./db/client.server";
import { apl } from "./apl-live-client.server";

// --- Canned upstream responses ------------------------------------------------------------------

const ROOM_STATES = [
    { room_id: "100", location_id: "194", published: "1" },
    { room_id: "101", location_id: "194", published: "0" },
];

const ROOM_MARKUP = [
    {
        rooms_markup:
            '<div class="room-option option-100"><strong>Study Room A</strong><ul>' +
            "<li>Capacity: 4</li><li>Floor: 1</li><li>Whiteboard: Yes</li>" +
            "<li>AirPlay: No</li><li>HDMI connection: Yes</li></ul></div>",
    },
    {
        rooms_markup:
            '<div class="room-option option-101"><strong>Study Room B</strong><ul>' +
            "<li>Capacity: 8</li></ul></div>",
    },
];

const SLR_REQUEST_HTML =
    '<select id="edit-location"><option value="">- Select -</option>' +
    '<option value="194">Carver Branch (Capacities: 4, 8)</option></select>';

const json = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
const htmlResponse = (body: string) => new Response(body, { status: 200 });

const fetchMock = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.includes("slr_room_states.json")) return json(ROOM_STATES);
    if (url.includes("html_slrs2025.json")) return json(ROOM_MARKUP);
    if (url.includes("/slr/request")) return htmlResponse(SLR_REQUEST_HTML);
    if (url.includes("slr_dates2.json")) return json([]); // no upstream reservations
    throw new Error(`unexpected fetch in test: ${url}`);
});

beforeAll(() => {
    hoisted.repos = new Repos(createDatabase(":memory:"));
});

beforeEach(async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    await apl.clearCache(); // reset the scraped read-model between tests
    fetchMock.mockClear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("apl scraper → normalized tables (slice 2)", () => {
    it("derives SLR branches from PUBLISHED rooms, with names from the request page", async () => {
        const result = await apl.getSharedLearningRoomBranches();
        expect(result.error).toBeUndefined();
        // Only room 100 is published (capacity 4); room 101 is unpublished and excluded.
        expect(result.data).toEqual([
            { locationId: "194", branch: "Carver Branch", capacities: [4], roomsAvailable: 1 },
        ]);
    });

    it("serves a second call from the tables without re-fetching (read-through cache)", async () => {
        await apl.getSharedLearningRoomBranches();
        const callsAfterFirst = fetchMock.mock.calls.length;
        expect(callsAfterFirst).toBeGreaterThan(0);

        await apl.getSharedLearningRoomBranches();
        expect(fetchMock.mock.calls.length).toBe(callsAfterFirst); // no new upstream requests
    });

    it("clearCache forces the next call to re-scrape", async () => {
        await apl.getSharedLearningRoomBranches();
        const before = fetchMock.mock.calls.length;
        await apl.clearCache();
        await apl.getSharedLearningRoomBranches();
        expect(fetchMock.mock.calls.length).toBeGreaterThan(before);
    });

    it("getRooms reconstructs LibraryRooms (published only) with derived availability", async () => {
        // 2026-06-22 is a Monday; Carver (194) opens 9:00–15:00.
        const result = await apl.getRooms({ date: new Date("2026-06-22") });
        expect(result.error).toBeUndefined();
        expect(result.data).toHaveLength(1);

        const room = result.data![0];
        expect(room.info.id).toBe("100");
        expect(room.branch.name).toBe("George Washington Carver Branch");
        expect(room.info.capacity).toBe(4);
        expect(room.info.amenities).toEqual({ whiteboard: true, airplay: false, hdmi: true });
        expect(room.info.availableTimes.length).toBeGreaterThan(0);
        expect(room.info.availableTimes[0]).toBe("9:00 AM");
    });

    it("seeds the static location→path mapping into branches", async () => {
        const result = await apl.getLocationPathMapping();
        expect(result.error).toBeUndefined();
        expect(result.data!["194"]).toBe("/carver-branch");
        expect(result.data!["3939"]).toBe("/central-library");
    });
});
