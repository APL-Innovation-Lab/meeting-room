import { describe, expect, it } from "vitest";

import { milesBetween, type LngLat } from "./geo";

const centralLibrary: LngLat = [-97.7501, 30.2669];

describe("milesBetween", () => {
    it("measures no distance between identical coordinates", () => {
        expect(milesBetween(centralLibrary, centralLibrary)).toBe(0);
    });

    it("measures a degree of latitude as about 69 miles", () => {
        const [lng, lat] = centralLibrary;
        expect(milesBetween(centralLibrary, [lng, lat + 1])).toBeCloseTo(69.09, 1);
    });

    // A degree of longitude shrinks with latitude (69.09 × cos 30° ≈ 59.8 mi in Austin, slightly
    // less along a great circle), so this also catches a swapped [lng, lat] tuple, which would
    // report the unscaled 69 miles.
    it("measures a degree of longitude against the cosine of the latitude", () => {
        const [lng, lat] = centralLibrary;
        expect(milesBetween(centralLibrary, [lng + 1, lat])).toBeCloseTo(59.67, 1);
    });

    it("measures the same distance in both directions", () => {
        const carverBranch: LngLat = [-97.7183, 30.2685];
        expect(milesBetween(centralLibrary, carverBranch)).toBeCloseTo(
            milesBetween(carverBranch, centralLibrary),
            10,
        );
    });
});
