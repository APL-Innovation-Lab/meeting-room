import {
    type LibraryRoom,
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
    searchUrl: string;
};

export type RoomSearchResult = {
    roomId: string;
    roomKind: LibraryRoom["info"]["type"];
    name: string;
    branch: string;
    floor?: number;
    capacity: number;
    address: string;
    image: string;
    amenities: LibraryRoom["info"]["amenities"];
    availableTimes: string[];
    date: string;
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

export type SuggestedAlternativeDay = {
    date: string;
    label: string;
    searchUrl: string;
};

export function createSearchParams(
    filters: SearchFilters,
    { date = filters.date }: { date?: string } = {},
): URLSearchParams {
    const searchParams = new URLSearchParams();
    searchParams.set("location", filters.location);
    searchParams.set("date", date);
    searchParams.set("duration", filters.duration);
    if (filters.people) searchParams.set("people", filters.people);
    if (filters.display) searchParams.set("display", "on");
    if (filters.hdmi) searchParams.set("hdmi", "on");
    if (filters.whiteboard) searchParams.set("whiteboard", "on");
    return searchParams;
}

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

export function toAbsoluteImagePath(image: string): string {
    if (!image) return "https://library.austintexas.gov/library/slr-408.jpg";
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    return `https://library.austintexas.gov${image}`;
}

export function createSearchResults(
    locationBranches: Array<LiveMeetingRoomBranch | LiveSharedLearningRoomBranch>,
    branchDirectory: LiveBranchDirectoryEntry[],
    roomKind: LibraryRoom["info"]["type"],
    filters: SearchFilters,
): BranchSearchResult[] {
    const grouped = new Map<string, BranchSearchResult>();
    const branchInfo = new Map<string, { address: string; image: string }>();

    for (const branch of branchDirectory) {
        const key = normalizeBranchName(branch.branch);
        if (branchInfo.has(key)) continue;
        branchInfo.set(key, {
            address: branch.address,
            image: branch.image,
        });
    }

    const baseSearchParams = createSearchParams(filters);

    for (const branch of locationBranches) {
        const info = branchInfo.get(normalizeBranchName(branch.branch));
        const branchSearchParams = new URLSearchParams(baseSearchParams);
        branchSearchParams.set("location", branch.branch);
        grouped.set(branch.locationId, {
            locationId: branch.locationId,
            branch: branch.branch,
            capacities: Array.isArray(branch.capacities) ? branch.capacities : [],
            address: info?.address ?? "",
            distance: "0.0",
            roomsAvailable: branch.roomsAvailable,
            image: toAbsoluteImagePath(info?.image ?? ""),
            searchUrl: `/${roomKind}?${branchSearchParams}`,
        });
    }

    return Array.from(grouped.values());
}

export function createRoomSearchResults(
    rooms: LibraryRoom[],
    branchResult: BranchSearchResult,
): RoomSearchResult[] {
    return rooms.map(room => ({
        roomId: room.info.id,
        roomKind: room.info.type,
        name: room.info.name,
        branch: room.branch.name || branchResult.branch,
        floor: room.branch.floor,
        capacity: room.info.capacity,
        address: room.branch.address || branchResult.address,
        image: toAbsoluteImagePath(room.branch.image || branchResult.image),
        amenities: room.info.amenities,
        availableTimes: room.info.availableTimes,
        date: room.info.date,
    }));
}

function parseCheckboxValue(searchParams: URLSearchParams, key: string): boolean {
    const value = searchParams.get(key);
    return value !== null && value !== "false" && value !== "0";
}

function isRealCalendarDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

/**
 * Normalizes a date filter to a canonical ISO "YYYY-MM-DD" calendar date, or "" if unparseable.
 *
 * The `date` param arrives in two shapes: the default/initial value is already ISO, but the USWDS
 * DatePicker submits its *visible* external input as US "MM/DD/YYYY". Downstream we build a
 * UTC-midnight `Date` from this string, and `new Date("MM/DD/YYYY")` parses as *local* midnight
 * (drifting the calendar day on non-UTC hosts) while `new Date("YYYY-MM-DD")` is UTC. Collapsing
 * both shapes to one canonical ISO date here makes the searched day unambiguous end-to-end (AV-6).
 */
export function normalizeToIsoDate(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
        const [, year, month, day] = iso;
        return isRealCalendarDate(+year, +month, +day) ? `${year}-${month}-${day}` : "";
    }

    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
        const month = Number(us[1]);
        const day = Number(us[2]);
        const year = Number(us[3]);
        if (!isRealCalendarDate(year, month, day)) return "";
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return "";
}

export function createSearchFilters(
    searchParams: URLSearchParams,
    fallbackDate: string,
): SearchFilters {
    return {
        location: searchParams.get("location")?.trim() || "all",
        date: normalizeToIsoDate(searchParams.get("date") ?? "") || fallbackDate,
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
