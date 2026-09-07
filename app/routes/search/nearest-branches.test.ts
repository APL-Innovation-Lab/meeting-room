import { describe, expect, it } from "vitest";

import { rankBranchesByDistance } from "./nearest-branches";
import { type BranchSearchResult } from "./search.data.server";

function branch(overrides: Partial<BranchSearchResult>): BranchSearchResult {
    return {
        locationId: "0",
        branch: "Branch",
        capacities: [4],
        address: "",
        roomsAvailable: 1,
        image: "",
        searchUrl: "/shared-learning-room",
        ...overrides,
    };
}

const central = branch({
    locationId: "3939",
    branch: "Central Library",
    lngLat: [-97.7501, 30.2669],
});
const carver = branch({
    locationId: "3947",
    branch: "Carver Branch",
    lngLat: [-97.7183, 30.2685],
});
const pleasantHill = branch({
    locationId: "3959",
    branch: "Pleasant Hill Branch",
    lngLat: [-97.7869, 30.1846],
});
const unmapped = branch({ locationId: "4001", branch: "Bookmobile" });

describe("rankBranchesByDistance", () => {
    it("puts the closest branch to the visitor first", () => {
        const nearCarver: [number, number] = [-97.7186, 30.269];

        const ranked = rankBranchesByDistance([central, pleasantHill, carver], nearCarver);

        expect(ranked.map(result => result.branch)).toEqual([
            "Carver Branch",
            "Central Library",
            "Pleasant Hill Branch",
        ]);
        expect(ranked[0].distanceInMiles).toBeLessThan(0.1);
        expect(ranked[1].distanceInMiles).toBeCloseTo(1.9, 1);
    });

    it("keeps branches with no coordinates last without dropping them", () => {
        const ranked = rankBranchesByDistance(
            [unmapped, pleasantHill, central],
            [-97.7501, 30.2669],
        );

        expect(ranked.map(result => result.branch)).toEqual([
            "Central Library",
            "Pleasant Hill Branch",
            "Bookmobile",
        ]);
        expect(ranked.at(-1)?.distanceInMiles).toBeUndefined();
    });
});
