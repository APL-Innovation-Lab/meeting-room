import {
    type LiveBranchCoordinate,
    type LiveBranchDirectoryEntry,
    type LiveMeetingRoomBranch,
    type LiveSharedLearningRoomBranch,
} from "~/lib/apl-client/apl-live-client.server";
import { pluralize } from "~/lib/pluralize";

export type BranchSearchResult = {
    locationId: string;
    branch: string;
    capacities: number[];
    address: string;
    distance: string;
    roomsAvailable: number;
    maxAvailableDuration?: number;
    image: string;
    url: string;
};

export type LocationOption = {
    locationId: string;
    value: string;
    label: string;
};

export type SearchFilters = {
    location: string;
    date: string;
    duration: string;
    people: string;
    display: boolean;
    hdmi: boolean;
    whiteboard: boolean;
};

export function formatLocationOptionLabel(result: BranchSearchResult): string {
    const hasCapacities = result.capacities.length > 0;
    const capacityLabel = pluralize(result.capacities.length, {
        zero: "",
        one: "Capacity",
        other: "Capacities",
    });
    const capacities = hasCapacities ? ` (${capacityLabel}: ${result.capacities.join(", ")})` : "";

    return `${result.branch}${capacities} [${result.distance} mi]`;
}

export function normalizeBranchName(value: string): string {
    return value
        .toLowerCase()
        .replace(/^austin\s+/g, "")
        .replace(/^george washington\s+/g, "")
        .replace(/\s*[(,]\s*faulk building\)?\s*$/g, "")
        .replace(/\s+faulk building$/g, "")
        .replace(/\snorth village\s*/g, " north village ")
        .replace(/\sjohn gillum branch/g, "north village branch")
        .replace(/&/g, "and")
        .replace(/[|,].*$/g, "")
        .replace(/[().]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function branchNamesMatch(a: string, b: string): boolean {
    const left = normalizeBranchName(a);
    const right = normalizeBranchName(b);
    return left === right || left.includes(right) || right.includes(left);
}

function toAbsoluteImagePath(image: string): string {
    if (!image) return "https://library.austintexas.gov/library/slr-408.jpg";
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    return `https://library.austintexas.gov${image}`;
}

function toAbsoluteBranchUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return `https://library.austintexas.gov${path}`;
    return "https://library.austintexas.gov/locations";
}

export function createSearchResults(
    locationBranches: Array<LiveMeetingRoomBranch | LiveSharedLearningRoomBranch>,
    branchDirectory: LiveBranchDirectoryEntry[],
    locationPathMapping: Record<string, string>,
): BranchSearchResult[] {
    const grouped = new Map<string, BranchSearchResult>();
    const branchInfo = new Map<string, { address: string; image: string; path: string }>();

    for (const branch of branchDirectory) {
        const key = normalizeBranchName(branch.branch);
        if (branchInfo.has(key)) continue;
        branchInfo.set(key, {
            address: branch.address,
            image: branch.image,
            path: branch.path,
        });
    }

    for (const branch of locationBranches) {
        const info = branchInfo.get(normalizeBranchName(branch.branch));
        grouped.set(branch.locationId, {
            locationId: branch.locationId,
            branch: branch.branch,
            capacities: Array.isArray(branch.capacities) ? branch.capacities : [],
            address: info?.address ?? "",
            distance: "0.0",
            roomsAvailable: branch.roomsAvailable,
            image: toAbsoluteImagePath(info?.image ?? ""),
            url: toAbsoluteBranchUrl(locationPathMapping[branch.locationId] ?? info?.path ?? ""),
        });
    }

    return Array.from(grouped.values());
}

function parseCheckboxValue(searchParams: URLSearchParams, key: string): boolean {
    const value = searchParams.get(key);
    return value !== null && value !== "false" && value !== "0";
}

export function createSearchFilters(
    searchParams: URLSearchParams,
    fallbackDate: string,
): SearchFilters {
    return {
        location: searchParams.get("location")?.trim() || "all",
        date: searchParams.get("date")?.trim() || fallbackDate,
        duration: searchParams.get("duration")?.trim() || "120",
        people: searchParams.get("people")?.trim() || "",
        display: parseCheckboxValue(searchParams, "display"),
        hdmi: parseCheckboxValue(searchParams, "hdmi"),
        whiteboard: parseCheckboxValue(searchParams, "whiteboard"),
    };
}

export function filterSearchResults(
    searchResults: BranchSearchResult[],
    filters: SearchFilters,
): BranchSearchResult[] {
    let filtered = searchResults;
    const normalizedLocation = filters.location.toLowerCase();

    if (normalizedLocation && normalizedLocation !== "all") {
        filtered = filtered.filter(result => result.branch.toLowerCase() === normalizedLocation);
    }

    const people = Number.parseInt(filters.people, 10);
    if (Number.isFinite(people) && people > 0) {
        filtered = filtered.filter(result =>
            result.capacities.some(capacity => capacity >= people),
        );
    }

    return filtered;
}

export function createLocationOptions(searchResults: BranchSearchResult[]): LocationOption[] {
    return searchResults.map(result => ({
        locationId: result.locationId,
        value: result.branch,
        label: formatLocationOptionLabel(result),
    }));
}

export function createBranchLngLats(
    searchResults: BranchSearchResult[],
    liveBranchCoordinates: LiveBranchCoordinate[],
): Array<[number, number]> {
    return searchResults
        .map(
            result =>
                liveBranchCoordinates.find(candidate =>
                    branchNamesMatch(result.branch, candidate.branch),
                )?.lngLat,
        )
        .filter((value): value is [number, number] => Boolean(value));
}
