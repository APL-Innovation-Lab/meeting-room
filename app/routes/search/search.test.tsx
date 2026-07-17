import { beforeEach, describe, expect, it, vi } from "vitest";

const aplMocks = vi.hoisted(() => ({
    getMeetingRoomBranches: vi.fn(),
    getSharedLearningRoomBranches: vi.fn(),
    getBranchDirectory: vi.fn(),
    getBranchCoordinates: vi.fn(),
    getMeetingRoomAvailabilityByLocation: vi.fn(),
    getMeetingRooms: vi.fn(),
    getRooms: vi.fn(),
}));

vi.mock("~/lib/apl-client/apl-live-client.server", () => ({ apl: aplMocks }));

import { loader } from "./search";

const unresolved = () => new Promise<never>(() => undefined);

const branch = {
    locationId: "3939",
    branch: "Central Library",
    capacities: [4, 8],
    roomsAvailable: 2,
};

const branchDirectory = [
    {
        branch: "Central Library",
        address: "710 W Cesar Chavez St, Austin, TX 78701",
        image: "/library/central.jpg",
        path: "/central-library",
    },
];

const room = {
    branch: {
        name: "Central Library",
        floor: 4,
        address: "",
        image: "/library/slr-409.jpg",
    },
    info: {
        id: "409",
        name: "Shared Learning - 409",
        type: "shared-learning-room" as const,
        capacity: 4,
        amenities: { airplay: true, hdmi: true, whiteboard: true },
        availableTimes: ["9:00 AM"],
        availableDurations: [15, 30, 60, 120],
        date: "2026-07-15",
    },
};

function mockResolvedMetadata(kind: "meeting-room" | "shared-learning-room") {
    const branchMethod =
        kind === "meeting-room"
            ? aplMocks.getMeetingRoomBranches
            : aplMocks.getSharedLearningRoomBranches;
    branchMethod.mockResolvedValue({ data: [branch], error: undefined });
    aplMocks.getBranchDirectory.mockResolvedValue({ data: branchDirectory, error: undefined });
    aplMocks.getBranchCoordinates.mockResolvedValue({ data: [], error: undefined });
}

beforeEach(() => {
    vi.clearAllMocks();
    aplMocks.getMeetingRoomBranches.mockReturnValue(unresolved());
    aplMocks.getSharedLearningRoomBranches.mockReturnValue(unresolved());
    aplMocks.getBranchDirectory.mockReturnValue(unresolved());
    aplMocks.getBranchCoordinates.mockReturnValue(unresolved());
    aplMocks.getMeetingRooms.mockReturnValue(unresolved());
    aplMocks.getMeetingRoomAvailabilityByLocation.mockReturnValue(unresolved());
    aplMocks.getRooms.mockReturnValue(unresolved());
});

describe("search route loader", () => {
    it("returns immediately while room data continues loading", async () => {
        const loaderResult = loader({
            params: { roomKind: "meeting-room" },
            url: new URL("http://localhost/meeting-room"),
        } as never);

        const outcome = await Promise.race([
            loaderResult.then(() => "returned" as const),
            new Promise<"blocked">(resolve => setTimeout(() => resolve("blocked"), 25)),
        ]);

        expect(outcome).toBe("returned");
        const loaderData = await loaderResult;
        expect("deferredSearchData" in loaderData).toBe(true);
    });

    it("keeps fast room-query failures inside the deferred results boundary", async () => {
        mockResolvedMetadata("shared-learning-room");
        const roomQueryError = new Error("room query failed");
        aplMocks.getRooms.mockResolvedValue({ data: undefined, error: roomQueryError });

        const loaderData = await loader({
            params: { roomKind: "shared-learning-room" },
            url: new URL("http://localhost/shared-learning-room?location=Central+Library"),
        } as never);
        const searchPageData = await loaderData.searchPageData;

        expect(searchPageData.locationOptions).toHaveLength(1);
        await expect(loaderData.deferredSearchData).rejects.toBe(roomQueryError);
    });

    it("returns room-level shared learning results for a selected branch", async () => {
        mockResolvedMetadata("shared-learning-room");
        aplMocks.getRooms.mockResolvedValue({ data: [room], error: undefined });

        const loaderData = await loader({
            params: { roomKind: "shared-learning-room" },
            url: new URL(
                "http://localhost/shared-learning-room?location=Central+Library&date=2026-07-15&duration=120",
            ),
        } as never);
        const searchPageData = await loaderData.searchPageData;
        const result = await searchPageData.deferredSearchData;

        expect(result).toMatchObject({
            mode: "rooms",
            branch: "Central Library",
            roomResults: [
                {
                    roomId: "409",
                    name: "Shared Learning - 409",
                    availableTimes: ["9:00 AM"],
                },
            ],
        });
    });

    it("uses the meeting-room detail query for a selected meeting-room branch", async () => {
        mockResolvedMetadata("meeting-room");
        aplMocks.getMeetingRooms.mockResolvedValue({
            data: [
                {
                    ...room,
                    info: {
                        ...room.info,
                        id: "781",
                        name: "Carver Branch Reading Room",
                        type: "meeting-room",
                    },
                },
            ],
            error: undefined,
        });

        const loaderData = await loader({
            params: { roomKind: "meeting-room" },
            url: new URL(
                "http://localhost/meeting-room?location=Central+Library&date=2026-07-15&duration=120",
            ),
        } as never);
        const searchPageData = await loaderData.searchPageData;
        const result = await searchPageData.deferredSearchData;

        expect(aplMocks.getMeetingRooms).toHaveBeenCalledWith(
            expect.objectContaining({ location: "Central Library", duration: 120 }),
        );
        expect(result).toMatchObject({
            mode: "rooms",
            roomResults: [{ roomId: "781", roomKind: "meeting-room" }],
        });
    });
});
