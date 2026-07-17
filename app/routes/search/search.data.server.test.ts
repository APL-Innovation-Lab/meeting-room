import { describe, expect, it } from "vitest";

import type {
    LibraryRoom,
    LiveSharedLearningRoomBranch,
} from "~/lib/apl-client/apl-live-client.server";

import {
    createRoomSearchResults,
    createSearchResults,
    type SearchFilters,
} from "./search.data.server";

const filters: SearchFilters = {
    location: "all",
    date: "2026-07-15",
    duration: "120",
    people: "4",
    display: true,
    hdmi: false,
    whiteboard: true,
};

const branch: LiveSharedLearningRoomBranch = {
    locationId: "3939",
    branch: "Central Library",
    capacities: [4, 8, 10],
    roomsAvailable: 3,
};

const libraryRoom: LibraryRoom = {
    branch: {
        name: "Central Library",
        floor: 6,
        address: "",
        image: "/library/slr-618.jpg",
    },
    info: {
        id: "618",
        name: "Shared Learning - 618",
        type: "shared-learning-room",
        capacity: 8,
        amenities: { airplay: true, hdmi: true, whiteboard: false },
        availableTimes: ["9:00 AM", "9:15 AM"],
        availableDurations: [15, 30, 45, 60, 120],
        date: "2026-07-15",
    },
};

describe("search result contracts", () => {
    it("builds internal branch links that preserve every active filter", () => {
        const [result] = createSearchResults(
            [branch],
            [
                {
                    branch: "Central Library",
                    address: "710 W Cesar Chavez St, Austin, TX 78701",
                    image: "/library/central.jpg",
                    path: "/central-library",
                },
            ],
            "shared-learning-room",
            filters,
        );

        expect(result.searchUrl).toBe(
            "/shared-learning-room?location=Central+Library&date=2026-07-15&duration=120&people=4&display=on&whiteboard=on",
        );
    });

    it("normalizes room details and falls back to the selected branch metadata", () => {
        const [branchResult] = createSearchResults(
            [branch],
            [
                {
                    branch: "Central Library",
                    address: "710 W Cesar Chavez St, Austin, TX 78701",
                    image: "/library/central.jpg",
                    path: "/central-library",
                },
            ],
            "shared-learning-room",
            filters,
        );

        expect(createRoomSearchResults([libraryRoom], branchResult)).toEqual([
            {
                roomId: "618",
                roomKind: "shared-learning-room",
                name: "Shared Learning - 618",
                branch: "Central Library",
                floor: 6,
                capacity: 8,
                address: "710 W Cesar Chavez St, Austin, TX 78701",
                image: "https://library.austintexas.gov/library/slr-618.jpg",
                amenities: { airplay: true, hdmi: true, whiteboard: false },
                availableTimes: ["9:00 AM", "9:15 AM"],
                date: "2026-07-15",
            },
        ]);
    });
});
