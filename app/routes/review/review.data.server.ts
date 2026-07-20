import {
    apl,
    parseClockMinutes,
    toTimeLabel,
    type Amenities,
    type LibraryRoom,
    type LiveBranchDirectoryEntry,
} from "~/lib/apl-client/apl-live-client.server";
import { Room } from "~/lib/room";

import {
    branchNamesMatch,
    normalizeToIsoDate,
    toAbsoluteImagePath,
} from "../search/search.data.server";

/** The slot the customer picked on the search page, carried into review through query params. */
export type ReviewSelection = {
    roomId: string;
    /** Branch filter carried over from search ("" or "all" means unfiltered). */
    location: string;
    /** Canonical "YYYY-MM-DD" calendar date. */
    date: string;
    /** Slot label as rendered on the search page, e.g. "11:00 AM". */
    time: string;
    /** Meeting length in minutes. */
    duration: number;
};

/** Everything the review page renders about the selected room, shaped server-side. */
export type ReviewRoomSummary = {
    roomId: string;
    name: string;
    kindLabel: string;
    branch: string;
    address: string;
    floor?: number;
    capacity: number;
    amenities: Array<{ label: string; icon: string }>;
    image: string;
};

// Mirrors the search page's duration fallback (createSearchFilters).
const DEFAULT_DURATION_MINUTES = 120;

/**
 * Parses the selection out of the review URL's query params, or returns `undefined` when any
 * required part is missing or malformed (the caller redirects back to search).
 */
export function parseReviewSelection(searchParams: URLSearchParams): ReviewSelection | undefined {
    const roomId = searchParams.get("roomId")?.trim() ?? "";
    const date = normalizeToIsoDate(searchParams.get("date") ?? "");
    const time = searchParams.get("time")?.trim() ?? "";
    if (!roomId || !date || parseClockMinutes(time) === undefined) return undefined;

    const parsedDuration = Number.parseInt(searchParams.get("duration") ?? "", 10);
    const duration =
        Number.isFinite(parsedDuration) && parsedDuration > 0
            ? parsedDuration
            : DEFAULT_DURATION_MINUTES;

    return {
        roomId,
        location: searchParams.get("location")?.trim() ?? "",
        date,
        time,
        duration,
    };
}

/** The search page for the same room kind, preserving the filters that carried into review. */
export function searchPageUrl(roomKind: Room.Kind, searchParams: URLSearchParams): string {
    const filters = new URLSearchParams(searchParams);
    filters.delete("roomId");
    filters.delete("time");
    const query = filters.toString();
    return query ? `/${roomKind}?${query}` : `/${roomKind}`;
}

/**
 * Re-resolves the selected room upstream for the selected date and duration. The `location`
 * carried over from search narrows the per-branch reservation fetches to the selected branch —
 * without it a meeting-room lookup scrapes every branch's reservations before responding. The
 * room's `availableTimes` are already narrowed to starts that fit the duration, so the caller can
 * verify the selected slot with a plain `includes`.
 */
export async function findReviewRoom(
    roomKind: Room.Kind,
    selection: ReviewSelection,
): Promise<LibraryRoom | undefined> {
    const options = {
        date: new Date(selection.date),
        duration: selection.duration,
        location:
            selection.location && selection.location !== "all" ? selection.location : undefined,
    };
    const roomsResult = Room.isMeeting(roomKind)
        ? await apl.getMeetingRooms(options)
        : await apl.getRooms(options);
    if (roomsResult.error) throw roomsResult.error;

    return roomsResult.data.find(room => room.info.id === selection.roomId);
}

/**
 * Resolves everything the room-summary panel needs, or `null` when the room is gone or the
 * selected slot is no longer open. Kicked off without `await` by the loader so the page shell
 * renders immediately while this streams in under a Suspense boundary.
 */
export async function resolveReviewSummary(
    roomKind: Room.Kind,
    selection: ReviewSelection,
): Promise<ReviewRoomSummary | null> {
    const [room, branchDirectoryResult] = await Promise.all([
        findReviewRoom(roomKind, selection),
        apl.getBranchDirectory(),
    ]);
    if (!room || !room.info.availableTimes.includes(selection.time)) return null;

    // Degrade gracefully (like search) if the directory feed fails: the page just falls back to
    // whatever address/image the room itself carries.
    const branchDirectory = branchDirectoryResult.error ? [] : branchDirectoryResult.data;
    return createReviewRoomSummary(room, branchDirectory);
}

// Same amenity labels/icons as the search results, so the two pages never disagree.
const AMENITY_TAGS = [
    ["airplay", "AirPlay", "/img/material-icons/airplay.svg"],
    ["hdmi", "HDMI", "/img/material-icons/settings_input_hdmi.svg"],
    ["whiteboard", "Whiteboard", "/img/material-icons/desktop_windows.svg"],
] as const satisfies ReadonlyArray<readonly [keyof Amenities, string, string]>;

const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});

/** "2025-03-24" -> "Mon 3/24/2025" (the design's header format). */
export function formatReviewDate(isoDate: string): string {
    return dateLabelFormatter.format(new Date(`${isoDate}T00:00:00Z`)).replace(",", "");
}

/** "11:00 AM" + 60 -> "11:00 AM - 12:00 PM". */
export function formatTimeRange(time: string, durationMinutes: number): string {
    const start = parseClockMinutes(time);
    if (start === undefined) return time;
    return `${toTimeLabel(start)} - ${toTimeLabel(start + durationMinutes)}`;
}

export function createReviewRoomSummary(
    room: LibraryRoom,
    branchDirectory: LiveBranchDirectoryEntry[],
): ReviewRoomSummary {
    // Meeting-room inventory carries no address or photo of its own; like the search results
    // (createRoomSearchResults), fall back to the branch-directory feed for those fields.
    const directoryEntry = branchDirectory.find(entry =>
        branchNamesMatch(entry.branch, room.branch.name),
    );

    return {
        roomId: room.info.id,
        name: room.info.name,
        kindLabel: room.info.type === "meeting-room" ? "Meeting Room" : "Shared Learning Room",
        branch: room.branch.name,
        address: room.branch.address || directoryEntry?.address || "",
        floor: room.branch.floor,
        capacity: room.info.capacity,
        amenities: AMENITY_TAGS.filter(([amenity]) => room.info.amenities[amenity]).map(
            ([, label, icon]) => ({ label, icon }),
        ),
        image: toAbsoluteImagePath(room.branch.image || directoryEntry?.image || ""),
    };
}
