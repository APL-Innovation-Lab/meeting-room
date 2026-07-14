import { beforeEach, describe, expect, it, vi } from "vitest";

const aplMocks = vi.hoisted(() => ({
    getMeetingRoomBranches: vi.fn(),
    getSharedLearningRoomBranches: vi.fn(),
    getBranchDirectory: vi.fn(),
    getBranchCoordinates: vi.fn(),
    getLocationPathMapping: vi.fn(),
    getMeetingRoomAvailabilityByLocation: vi.fn(),
    getRooms: vi.fn(),
}));

vi.mock("~/lib/apl-client/apl-live-client.server", () => ({ apl: aplMocks }));

import { loader } from "./search";

const unresolved = () => new Promise<never>(() => undefined);

beforeEach(() => {
    vi.clearAllMocks();
    aplMocks.getMeetingRoomBranches.mockReturnValue(unresolved());
    aplMocks.getSharedLearningRoomBranches.mockReturnValue(unresolved());
    aplMocks.getBranchDirectory.mockReturnValue(unresolved());
    aplMocks.getBranchCoordinates.mockReturnValue(unresolved());
    aplMocks.getLocationPathMapping.mockReturnValue(unresolved());
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
});
