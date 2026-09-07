import { milesBetween, type LngLat } from "~/utils/geo";

import { type BranchSearchResult } from "./search.data.server";

export type RankedBranchSearchResult = BranchSearchResult & {
    distanceInMiles?: number;
};

/**
 * Orders branch results by how far each one is from the visitor, nearest first.
 *
 * Branches the coordinate feed doesn't cover keep their upstream order at the end of the list
 * rather than being dropped — an unmapped branch still has bookable rooms.
 */
export function rankBranchesByDistance(
    searchResults: BranchSearchResult[],
    userLngLat: LngLat,
): RankedBranchSearchResult[] {
    return searchResults
        .map(result => ({
            ...result,
            distanceInMiles: result.lngLat ? milesBetween(userLngLat, result.lngLat) : undefined,
        }))
        .sort((a, b) => {
            if (a.distanceInMiles === undefined) return b.distanceInMiles === undefined ? 0 : 1;
            if (b.distanceInMiles === undefined) return -1;
            return a.distanceInMiles - b.distanceInMiles;
        });
}
