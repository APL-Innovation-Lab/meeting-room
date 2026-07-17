import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import validator from "validator";
import { z } from "zod";

import { Room } from "~/lib/room";

import type { NewRoom, NewSpecialDate, Room as RoomRow } from "./db/schema";

import { getRepos, type Repos } from "./db/client.server";

/**
 * Represents a safe result of an operation that can either be successful with data or fail with an error.
 */
export type SafeResult<Data, Err extends Error = Error> =
    | {
          data: Data;
          error: undefined;
      }
    | {
          data: undefined;
          error: Err;
      };

/**
 * Describes the amenities available in a library room.
 */
export type Amenities = {
    airplay: boolean;
    hdmi: boolean;
    whiteboard: boolean;
};

/**
 * Represents a library branch with its details.
 */
export type LibraryBranch = {
    name: string;
    floor?: number;
    address: string;
    image: string;
};

/**
 * Represents a library room with its branch, information, and availability.
 */
export type LibraryRoom = {
    branch: LibraryBranch;
    info: {
        id: string;
        name: string;
        type: "shared-learning-room" | "meeting-room";
        capacity: number;
        amenities: Partial<Amenities>;
        availableTimes: string[];
        availableDurations: number[];
        date: string;
    };
};

/**
 * Options for searching available library rooms.
 */
export type SearchOptions = {
    location?: string;
    date?: Date;
    time?: string;
    duration?: number;
    capacity?: number;
    amenities?: Partial<Amenities>;
};

function matchesRequestedAmenities(
    available: Partial<Amenities>,
    requested: Partial<Amenities> | undefined,
): boolean {
    if (!requested) return true;
    return Object.entries(requested).every(([key, expected]) => {
        if (expected === undefined) return true;
        const actual = available[key as keyof Amenities];
        return actual === undefined || actual === expected;
    });
}

/**
 * Schema for validating shared learning room reservation options.
 */
export const SharedLearningRoomReservationOptionsSchema = z.object({
    roomId: z.string(),
    meetingTopic: z.string(),
    fullName: z.string(),
    emailAddress: z.email(),
    date: z.string(),
    time: z.string(),
});

/**
 * Schema for validating meeting room reservation options.
 */
export const MeetingRoomReservationOptionsSchema =
    SharedLearningRoomReservationOptionsSchema.extend({
        orgName: z.string(),
        orgPurpose: z.string(),
        website: z.url().optional(),
        phoneNumber: z.string().refine(value => validator.isMobilePhone(value, "any")),
    });

/**
 * Union schema for validating reservation options for any room type.
 */
export const ReservationOptionsSchema = z.union([
    MeetingRoomReservationOptionsSchema.extend({ roomKind: z.literal("meeting-room") }),
    SharedLearningRoomReservationOptionsSchema.extend({
        roomKind: z.literal("shared-learning-room"),
    }),
]);

/**
 * Represents a reservation for a library room.
 */
export type Reservation = {
    roomId: string;
    meetingTopic: string;
    fullName: string;
    emailAddress: string;
    date: string;
    time: string;
    roomKind: Room.Kind;
    roomName: string;
    branchName: string;
    // Optional fields for meeting rooms
    orgName?: string;
    orgPurpose?: string;
    website?: string;
    phoneNumber?: string;
};

const DEFAULT_BASE_URL = "https://library.austintexas.gov";
const RESERVATIONS_FETCH_CONCURRENCY = 8;

const LocationInfoById = {
    "183": {
        name: "Austin History Center",
        address: "810 Guadalupe St, Austin, TX 78701",
        image: "/library/ahc-jhfslr-220.JPG",
    },
    "194": {
        name: "George Washington Carver Branch",
        address: "1161 Angelina St, Austin, TX 78702",
        image: "/library/acbslr-103.jpg",
    },
    "205": {
        name: "Ruiz Branch",
        address: "1600 Grove Blvd, Austin, TX 78741",
        image: "/library/arzslr-103.jpg",
    },
    "209": {
        name: "Terrazas Branch",
        address: "1105 E Cesar Chavez St, Austin, TX 78702",
        image: "/library/atbslr-103.jpg",
    },
    "3939": {
        name: "Central Library",
        address: "710 W Cesar Chavez St, Austin, TX 78701",
        image: "/library/slr-408.jpg",
    },
} as const;

type LocationId = keyof typeof LocationInfoById;

export type LiveRoom = {
    roomId: string;
    locationId: string;
    published: boolean;
    name: string;
    capacity: number;
    floor: number;
    image: string;
    amenities: Amenities;
};

type MeetingRoomInventoryLocation = {
    locationId: string;
    branch: string;
};

type MeetingRoomInventoryRoom = {
    roomId: string;
    branch: string;
    capacity: number;
    name: string;
    floor?: number;
    image?: string;
    amenities: Partial<Amenities>;
};

type MeetingRoomInventory = {
    locations: MeetingRoomInventoryLocation[];
    roomsByLocation: Record<string, MeetingRoomInventoryRoom[]>;
};

export type LiveMeetingRoomBranch = {
    locationId: string;
    branch: string;
    capacities: number[];
    roomsAvailable: number;
};

export type LiveSharedLearningRoomBranch = {
    locationId: string;
    branch: string;
    capacities: number[];
    roomsAvailable: number;
};

export type LiveBranchDirectoryEntry = {
    branch: string;
    address: string;
    image: string;
    path: string;
};

export type LiveBranchCoordinate = {
    branch: string;
    lngLat: [number, number];
};

const RoomStateSchema = z.object({
    room_id: z.string(),
    location_id: z.string(),
    published: z.union([z.string(), z.number(), z.boolean()]),
});

const RoomMarkupSchema = z.object({
    rooms_markup: z.string(),
});

const ReservationSchema = z.object({
    room: z.string(),
    start: z.string(),
    end: z.string(),
});

const MeetingRoomReservationSchema = z.object({
    room: z.union([z.string(), z.number()]).transform(value => String(value)),
    start: z.string(),
    end: z.string(),
});

/** The repositories, seeded with static reference data on first use (lazy, so importing this module
 * in a unit test never opens the on-disk database — only the async fetchers below reach the store). */
function repos(): Repos {
    const r = getRepos();
    ensureSeeded(r);
    return r;
}

let seeded = false;
/** Mirrors the static domain constants into their tables on first DB use (idempotent per process). */
function ensureSeeded(r: Repos): void {
    if (seeded) return;
    r.branches.seedPaths(STATIC_LOCATION_PATH_MAPPING);
    r.operatingHours.replaceAll(operatingHoursSeedRows());
    r.roomConflicts.replaceAll(roomConflictSeedRows());
    seeded = true;
}

function operatingHoursSeedRows(): Array<{
    locationId: string;
    weekday: number;
    openingMinute: number | null;
    closingMinute: number | null;
}> {
    const rows = [];
    for (const [locationId, byWeekday] of Object.entries(OPERATING_HOURS_BY_LOCATION)) {
        for (const [weekday, hours] of Object.entries(byWeekday)) {
            rows.push({
                locationId,
                weekday: Number(weekday),
                openingMinute: hours.opening === null ? null : hours.opening * 60,
                closingMinute: hours.closing === null ? null : hours.closing * 60,
            });
        }
    }
    return rows;
}

function roomConflictSeedRows(): Array<{ roomId: string; conflictsWith: string }> {
    const rows = [];
    for (const [roomId, conflicts] of Object.entries(MR_COMBINED_ROOM_CONFLICTS)) {
        for (const conflictsWith of conflicts) {
            rows.push({ roomId, conflictsWith });
        }
    }
    return rows;
}

/** Read-through freshness watermark: did we sync this source within the TTL? */
function isFresh(source: string): boolean {
    return repos().syncState.isFresh(source);
}

function markSynced(source: string): void {
    repos().syncState.touch(source);
}

/** SLR rooms (a `LiveRoom`) <-> the `rooms` table row. */
function liveRoomToRow(room: LiveRoom, syncedAt: string): NewRoom {
    return {
        roomId: room.roomId,
        locationId: room.locationId,
        kind: "shared-learning-room",
        name: room.name,
        capacity: room.capacity,
        floor: room.floor,
        image: room.image,
        published: room.published,
        airplay: room.amenities.airplay,
        hdmi: room.amenities.hdmi,
        whiteboard: room.amenities.whiteboard,
        syncedAt,
    };
}

function rowToLiveRoom(row: RoomRow): LiveRoom {
    return {
        roomId: row.roomId,
        locationId: row.locationId,
        published: row.published,
        name: row.name ?? "",
        capacity: row.capacity ?? 0,
        floor: row.floor ?? 1,
        image: row.image ?? "",
        amenities: {
            airplay: row.airplay,
            hdmi: row.hdmi,
            whiteboard: row.whiteboard,
        },
    };
}

function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "");
}

function cleanText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}

const STATIC_LOCATION_PATH_MAPPING: Record<string, string> = {
    "183": "/austin-history-center",
    "194": "/carver-branch",
    "200": "/john-gillum-branch",
    "205": "/ruiz-branch",
    "209": "/terrazas-branch",
    "3939": "/central-library",
};

async function mapWithConcurrency<T, U>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<U>,
): Promise<U[]> {
    if (items.length === 0) return [];

    const limit = Math.max(1, Math.floor(concurrency));
    const results = Array.from<U>({ length: items.length });
    let cursor = 0;

    async function worker(): Promise<void> {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index]);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
    return results;
}

/** location_id -> location-page path. Paths are seeded into `branches` on first DB use. */
function loadLocationPathMapping(): Record<string, string> {
    return repos().branches.pathMap();
}

type ParseNode = DefaultTreeAdapterMap["node"];
type ParseElement = DefaultTreeAdapterMap["element"];
type ParseParent = DefaultTreeAdapterMap["parentNode"];
type ParseChild = DefaultTreeAdapterMap["childNode"];

function isElement(node: ParseNode): node is ParseElement {
    return typeof node === "object" && node !== null && "tagName" in node;
}

function getChildNodes(node: ParseNode | ParseParent): ParseChild[] {
    if ("childNodes" in node && Array.isArray(node.childNodes)) {
        return node.childNodes;
    }
    return [];
}

function getAttr(node: ParseElement, name: string): string | undefined {
    return node.attrs.find(attr => attr.name === name)?.value;
}

function getClassList(node: ParseElement): string[] {
    const className = getAttr(node, "class");
    return className ? className.split(/\s+/).filter(Boolean) : [];
}

function getTextContent(node: ParseNode): string {
    if ("value" in node && typeof node.value === "string") {
        return node.value;
    }

    return getChildNodes(node)
        .map(child => getTextContent(child))
        .join("");
}

function walkNodes(root: ParseNode | ParseParent): ParseNode[] {
    const nodes: ParseNode[] = [];
    const stack: ParseNode[] = [...getChildNodes(root)];

    while (stack.length) {
        const node = stack.shift()!;
        nodes.push(node);
        stack.unshift(...getChildNodes(node));
    }

    return nodes;
}

function parseYesNo(value: string): boolean {
    return value.toLowerCase() === "yes";
}

function getTextSegmentsByBr(node: ParseElement): string[] {
    const segments: string[] = [];
    let current = "";

    for (const child of getChildNodes(node)) {
        if (isElement(child) && child.tagName === "br") {
            const text = cleanText(current);
            if (text) segments.push(text);
            current = "";
            continue;
        }

        current += getTextContent(child);
    }

    const tail = cleanText(current);
    if (tail) segments.push(tail);
    return segments;
}

function parseBranchOptionLabel(
    label: string,
): { branch: string; capacities: number[]; roomsAvailable: number } | undefined {
    const trimmed = cleanText(label);
    if (!trimmed || trimmed === "- Select -") return undefined;

    const branch = trimmed.replace(/\s+\((Capacities?|Capacity):.*$/i, "").trim();
    const capacitiesMatch = trimmed.match(/\((Capacities?|Capacity):\s*([^)]+)\)/i);
    const capacitiesRaw = capacitiesMatch?.[2] ?? "";
    const capacities = capacitiesRaw
        .split(",")
        .map(value => Number.parseInt(value.trim(), 10))
        .filter(value => Number.isFinite(value));

    return {
        branch,
        capacities,
        roomsAvailable: Math.max(1, capacities.length),
    };
}

function parseLocationOptions(
    html: string,
    selectId: string,
): Array<{ locationId: string; label: string }> {
    const fragment = parseFragment(html);
    const nodes = walkNodes(fragment);
    const locationSelect = nodes.find(node => {
        if (!isElement(node) || node.tagName !== "select") return false;
        return getAttr(node, "id") === selectId;
    });
    if (!locationSelect || !isElement(locationSelect)) return [];

    return getChildNodes(locationSelect)
        .filter(isElement)
        .filter(node => node.tagName === "option")
        .map(option => ({
            locationId: cleanText(getAttr(option, "value") ?? ""),
            label: cleanText(getTextContent(option)),
        }))
        .filter(option => option.locationId && option.label && option.label !== "- Select -");
}

function normalizeMeetingRoomBranchName(value: string): string {
    return cleanText(value)
        .toLowerCase()
        .replace(/\s+\((capacities?|capacity):.*$/i, "")
        .replace(/\s*-\s*capacity:.*$/i, "")
        .replace(/\(north village\)/gi, "")
        .replace(/\broad\b/gi, "")
        .replace(/\s+#\d+\s*(?:&\s*#\d+)?/g, "")
        .replace(/\s+reading room\b/gi, "")
        .replace(/\bahc\b/g, "austin history center")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

/**
 * Substring-matches two already-normalized branch names, but treats an empty needle as "no match".
 * `normalizeMeetingRoomBranchName` can strip a label down to "" (e.g. "(North Village)" or a bare
 * "- Capacity: 10"), and since every string `.includes("")`, an empty value used to match *every*
 * branch — assigning unparseable rooms to all locations (AV-5). Requiring both sides to be
 * non-empty drops the ambiguous room instead of fanning it out everywhere.
 */
export function branchNeedleMatches(left: string, right: string): boolean {
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
}

function parseMeetingRoomOptionLabel(
    label: string,
): { branch: string; capacity: number } | undefined {
    const trimmed = cleanText(label);
    if (!trimmed || trimmed === "- Select -" || /^shared learning\b/i.test(trimmed)) {
        return undefined;
    }

    const match = trimmed.match(/^(.*)\s*-\s*Capacity:\s*(\d+)\s*$/i);
    if (!match) return undefined;

    const branch = cleanText(match[1]);
    const capacity = Number.parseInt(match[2], 10);
    if (!branch || !Number.isFinite(capacity)) return undefined;

    return {
        branch,
        capacity,
    };
}

function parseBranchDirectory(html: string): LiveBranchDirectoryEntry[] {
    const fragment = parseFragment(html);
    const nodes = walkNodes(fragment);
    const teasers = nodes.filter(
        node => isElement(node) && getClassList(node).includes("apl_location_teaser"),
    );

    const branches = teasers
        .map(node => {
            if (!isElement(node)) return undefined;

            const teaserNodes = walkNodes(node);
            const titleElement = teaserNodes.find(
                child =>
                    isElement(child) &&
                    child.tagName === "h2" &&
                    getClassList(child).includes("field-title"),
            );
            if (!titleElement || !isElement(titleElement)) return undefined;

            const branch = cleanText(getTextContent(titleElement));
            if (!branch) return undefined;

            const imageElement = teaserNodes.find(
                child =>
                    isElement(child) && child.tagName === "img" && Boolean(getAttr(child, "src")),
            );
            const image =
                imageElement && isElement(imageElement)
                    ? cleanText(getAttr(imageElement, "src") ?? "")
                    : "";
            const titleNodes = walkNodes(titleElement);
            const linkElement = titleNodes.find(
                child =>
                    isElement(child) && child.tagName === "a" && Boolean(getAttr(child, "href")),
            );
            const path =
                linkElement && isElement(linkElement)
                    ? cleanText(getAttr(linkElement, "href") ?? "")
                    : "";

            const phoneAddressElement = teaserNodes.find(
                child =>
                    isElement(child) &&
                    child.tagName === "div" &&
                    getClassList(child).includes("phone-address"),
            );
            const segments =
                phoneAddressElement && isElement(phoneAddressElement)
                    ? getTextSegmentsByBr(phoneAddressElement)
                    : [];
            const address = segments.slice(1).join(", ");

            return {
                branch,
                address,
                image,
                path,
            };
        })
        .filter((value): value is LiveBranchDirectoryEntry => Boolean(value));

    const seen = new Set<string>();
    return branches.filter(branch => {
        const key = branch.branch.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function parseRoomMarkup(markup: string): Omit<LiveRoom, "locationId" | "published"> | undefined {
    const fragment = parseFragment(markup);
    const nodes = walkNodes(fragment);

    const roomRoot = nodes.find(node => {
        if (!isElement(node)) return false;
        const classList = getClassList(node);
        return (
            classList.includes("room-option") &&
            classList.some(className => /^option-\d+$/.test(className))
        );
    });
    if (!roomRoot || !isElement(roomRoot)) return undefined;

    const roomIdClass = getClassList(roomRoot).find(className => /^option-\d+$/.test(className));
    const id = roomIdClass ? roomIdClass.replace("option-", "") : undefined;
    if (!id) return undefined;

    const roomNodes = walkNodes(roomRoot);
    const strong = roomNodes.find(node => isElement(node) && node.tagName === "strong");
    const name = cleanText(strong ? getTextContent(strong) : `Room ${id}`);

    const firstImage = roomNodes.find(node => isElement(node) && node.tagName === "img");
    const image =
        firstImage && isElement(firstImage) ? cleanText(getAttr(firstImage, "src") ?? "") : "";

    const listItems = roomNodes.filter(node => isElement(node) && node.tagName === "li");
    let capacity = 0;
    let floor = 1;
    const amenities: Amenities = {
        whiteboard: false,
        airplay: false,
        hdmi: false,
    };

    for (const item of listItems) {
        if (!isElement(item)) continue;
        const text = cleanText(getTextContent(item));
        const [label, rawValue] = text.split(":");
        if (!rawValue) continue;

        const value = cleanText(rawValue);
        if (label === "Capacity") {
            const parsed = Number.parseInt(value, 10);
            capacity = Number.isFinite(parsed) ? parsed : capacity;
        }

        if (label === "Floor") {
            const parsed = Number.parseInt(value, 10);
            floor = Number.isFinite(parsed) ? parsed : floor;
        }

        if (label === "Whiteboard") {
            amenities.whiteboard = parseYesNo(value);
        }

        if (label === "AirPlay") {
            amenities.airplay = parseYesNo(value);
        }

        if (label === "HDMI connection") {
            amenities.hdmi = parseYesNo(value);
        }
    }

    return {
        roomId: id,
        name,
        capacity: Number.isFinite(capacity) ? capacity : 0,
        floor: Number.isFinite(floor) ? floor : 1,
        image,
        amenities,
    };
}

function normalizeKmlBranchName(value: string): string {
    return cleanText(value)
        .replace(/\s*[|,]\s*Austin Public Library$/i, "")
        .replace(/^Austin Public Library\s+/i, "")
        .trim();
}

function parseBranchCoordinatesKml(kml: string): LiveBranchCoordinate[] {
    const entries: LiveBranchCoordinate[] = [];
    const placemarkRe =
        /<Placemark>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<coordinates>\s*([-\d.]+),([-\d.]+)(?:,[-\d.]*)?\s*<\/coordinates>[\s\S]*?<\/Placemark>/gi;

    let match: RegExpExecArray | null = placemarkRe.exec(kml);
    while (match) {
        const branch = normalizeKmlBranchName(match[1] ?? "");
        const lng = Number.parseFloat(match[2] ?? "");
        const lat = Number.parseFloat(match[3] ?? "");

        if (branch && Number.isFinite(lng) && Number.isFinite(lat)) {
            entries.push({
                branch,
                lngLat: [lng, lat],
            });
        }

        match = placemarkRe.exec(kml);
    }

    const seen = new Set<string>();
    return entries.filter(entry => {
        const key = entry.branch.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    return (await response.json()) as T;
}

async function fetchLiveRooms(baseUrl = DEFAULT_BASE_URL): Promise<LiveRoom[]> {
    const now = Date.now();
    const host = normalizeBaseUrl(baseUrl);
    const source = `slr_rooms:${host}`;
    if (isFresh(source)) {
        return repos().rooms.listByKind("shared-learning-room").map(rowToLiveRoom);
    }

    const [roomStatesRaw, roomMarkupRaw] = await Promise.all([
        fetchJson<unknown>(`${host}/slr_room_states.json?t=${now}`),
        fetchJson<unknown>(`${host}/html_slrs2025.json?t=${now}`),
    ]);

    const roomStates = z.array(RoomStateSchema).parse(roomStatesRaw);
    const roomMarkup = z.array(RoomMarkupSchema).parse(roomMarkupRaw);

    const markupByRoomId = new Map<string, Omit<LiveRoom, "locationId" | "published">>();

    for (const item of roomMarkup) {
        const parsed = parseRoomMarkup(item.rooms_markup);
        if (parsed) {
            markupByRoomId.set(parsed.roomId, parsed);
        }
    }

    const rooms: LiveRoom[] = roomStates
        .map(row => {
            const parsed = markupByRoomId.get(row.room_id);
            if (!parsed) return undefined;

            return {
                ...parsed,
                locationId: row.location_id,
                published: String(row.published).toLowerCase() === "1" || row.published === true,
            };
        })
        .filter((value): value is LiveRoom => Boolean(value));

    const syncedAt = new Date().toISOString();
    repos().rooms.replaceByKind(
        "shared-learning-room",
        rooms.map(room => liveRoomToRow(room, syncedAt)),
    );
    markSynced(source);

    return rooms;
}

/**
 * Scrapes the meeting-rooms request page once per TTL and upserts the normalized rows: branch display
 * names (keyed by location) and the meeting rooms themselves. Each room is assigned to its single
 * best-matching location — the old code fanned a fuzzily-matched room out to EVERY matching location;
 * single assignment is the source-of-truth simplification (see migration notes).
 */
async function ensureMeetingRoomsSynced(host: string): Promise<void> {
    const source = `meeting_rooms:${host}`;
    if (isFresh(source)) return;

    const response = await fetch(`${host}/meeting-rooms/request?t=${Date.now()}`);
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${host}/meeting-rooms/request`);
    }

    const html = await response.text();
    const locations = parseLocationOptions(html, "edit-location")
        .map(option => {
            const parsed = parseBranchOptionLabel(option.label);
            return parsed ? { locationId: option.locationId, branch: parsed.branch } : undefined;
        })
        .filter((value): value is { locationId: string; branch: string } => Boolean(value));
    if (!locations.length) {
        throw new Error("Could not find meeting-room location selector.");
    }

    const syncedAt = new Date().toISOString();
    const roomRows = parseLocationOptions(html, "edit-meeting-room")
        .map((option): NewRoom | undefined => {
            const parsed = parseMeetingRoomOptionLabel(option.label);
            if (!parsed) return undefined;
            const normalizedRoom = normalizeMeetingRoomBranchName(parsed.branch);
            const location = locations.find(loc =>
                branchNeedleMatches(normalizedRoom, normalizeMeetingRoomBranchName(loc.branch)),
            );
            if (!location) return undefined;
            return {
                roomId: option.locationId,
                locationId: location.locationId,
                kind: "meeting-room",
                name: parsed.branch,
                capacity: parsed.capacity,
                published: true,
                syncedAt,
            };
        })
        .filter((value): value is NewRoom => Boolean(value));

    const r = repos();
    r.branches.upsertNames(
        locations.map(loc => ({ locationId: loc.locationId, name: loc.branch })),
    );
    r.rooms.replaceByKind("meeting-room", roomRows);
    markSynced(source);
}

/** Per-location capacities + room count, derived from the meeting rooms in the table. */
function deriveMeetingRoomBranches(): LiveMeetingRoomBranch[] {
    const r = repos();
    const nameByLocation = new Map(r.branches.list().map(b => [b.locationId, b.name ?? ""]));
    const countByLocation = new Map<string, number>();
    const capacitiesByLocation = new Map<string, Set<number>>();

    for (const room of r.rooms.listByKind("meeting-room")) {
        countByLocation.set(room.locationId, (countByLocation.get(room.locationId) ?? 0) + 1);
        const capacities = capacitiesByLocation.get(room.locationId) ?? new Set<number>();
        if (room.capacity && room.capacity > 0) capacities.add(room.capacity);
        capacitiesByLocation.set(room.locationId, capacities);
    }

    return Array.from(countByLocation.entries()).map(([locationId, roomsAvailable]) => ({
        locationId,
        branch: nameByLocation.get(locationId) ?? "",
        capacities: Array.from(capacitiesByLocation.get(locationId) ?? []).sort((a, b) => a - b),
        roomsAvailable,
    }));
}

/** The inventory view (locations + their rooms), grouped from the meeting rooms in the table. */
function deriveMeetingRoomInventory(): MeetingRoomInventory {
    const r = repos();
    const nameByLocation = new Map(r.branches.list().map(b => [b.locationId, b.name ?? ""]));
    const roomsByLocation: Record<string, MeetingRoomInventoryRoom[]> = {};

    for (const room of r.rooms.listByKind("meeting-room")) {
        const hasRoomDetails = room.floor !== null || room.image !== null;
        (roomsByLocation[room.locationId] ??= []).push({
            roomId: room.roomId,
            branch: nameByLocation.get(room.locationId) ?? "",
            capacity: room.capacity ?? 0,
            name: room.name ?? "",
            floor: room.floor ?? undefined,
            image: room.image ?? undefined,
            amenities: hasRoomDetails
                ? {
                      airplay: room.airplay,
                      hdmi: room.hdmi,
                      whiteboard: room.whiteboard,
                  }
                : {},
        });
    }

    const locations: MeetingRoomInventoryLocation[] = Object.keys(roomsByLocation).map(
        locationId => ({ locationId, branch: nameByLocation.get(locationId) ?? "" }),
    );

    return { locations, roomsByLocation };
}

async function fetchMeetingRoomBranches(
    baseUrl = DEFAULT_BASE_URL,
): Promise<LiveMeetingRoomBranch[]> {
    await ensureMeetingRoomsSynced(normalizeBaseUrl(baseUrl));
    return deriveMeetingRoomBranches();
}

async function fetchMeetingRoomInventory(
    baseUrl = DEFAULT_BASE_URL,
): Promise<MeetingRoomInventory> {
    await ensureMeetingRoomsSynced(normalizeBaseUrl(baseUrl));
    return deriveMeetingRoomInventory();
}

/** Scrapes the SLR request page once per TTL for branch display names (keyed by location). */
async function ensureSlrBranchNamesSynced(host: string): Promise<void> {
    const source = `slr_branch_names:${host}`;
    if (isFresh(source)) return;

    const response = await fetch(`${host}/slr/request?t=${Date.now()}`);
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${host}/slr/request`);
    }
    const html = await response.text();
    const names = parseLocationOptions(html, "edit-location")
        .map(option => {
            const parsed = parseBranchOptionLabel(option.label);
            return parsed ? { locationId: option.locationId, name: parsed.branch } : undefined;
        })
        .filter((value): value is { locationId: string; name: string } => Boolean(value));

    repos().branches.upsertNames(names);
    markSynced(source);
}

/** Per-branch SLR availability, derived from PUBLISHED SLR rooms grouped by location. */
function deriveSharedLearningRoomBranches(): LiveSharedLearningRoomBranch[] {
    const r = repos();
    const nameByLocation = new Map(r.branches.list().map(b => [b.locationId, b.name ?? ""]));
    const countByLocation = new Map<string, number>();
    const capacitiesByLocation = new Map<string, Set<number>>();

    for (const room of r.rooms.listByKind("shared-learning-room")) {
        if (!room.published) continue;
        const locationId = cleanText(room.locationId);
        countByLocation.set(locationId, (countByLocation.get(locationId) ?? 0) + 1);
        const capacities = capacitiesByLocation.get(locationId) ?? new Set<number>();
        if (room.capacity && room.capacity > 0) capacities.add(room.capacity);
        capacitiesByLocation.set(locationId, capacities);
    }

    return Array.from(countByLocation.entries())
        .filter(([, roomsAvailable]) => roomsAvailable > 0)
        .map(([locationId, roomsAvailable]) => ({
            locationId,
            branch: nameByLocation.get(locationId) ?? "",
            capacities: Array.from(capacitiesByLocation.get(locationId) ?? []).sort(
                (a, b) => a - b,
            ),
            roomsAvailable,
        }));
}

async function fetchSharedLearningRoomBranches(
    baseUrl = DEFAULT_BASE_URL,
): Promise<LiveSharedLearningRoomBranch[]> {
    const host = normalizeBaseUrl(baseUrl);
    await Promise.all([fetchLiveRooms(host), ensureSlrBranchNamesSynced(host)]);
    return deriveSharedLearningRoomBranches();
}

async function fetchBranchDirectory(
    baseUrl = DEFAULT_BASE_URL,
): Promise<LiveBranchDirectoryEntry[]> {
    const host = normalizeBaseUrl(baseUrl);
    const source = `branch_directory:${host}`;
    if (isFresh(source)) {
        return repos()
            .branchDirectory.list()
            .map(row => ({
                branch: row.branchName,
                address: row.address ?? "",
                image: row.image ?? "",
                path: row.path ?? "",
            }));
    }
    const response = await fetch(`${host}/locations?t=${Date.now()}`);
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${host}/locations`);
    }

    const html = await response.text();
    const branches = parseBranchDirectory(html);

    const syncedAt = new Date().toISOString();
    repos().branchDirectory.replaceAll(
        branches.map(branch => ({
            branchName: branch.branch,
            address: branch.address,
            image: branch.image,
            path: branch.path,
            syncedAt,
        })),
    );
    markSynced(source);
    return branches;
}

async function fetchBranchCoordinates(): Promise<LiveBranchCoordinate[]> {
    const source = "branch_coordinates:global";
    if (isFresh(source)) {
        return repos()
            .branchCoordinates.list()
            .map(row => ({
                branch: row.branchName,
                lngLat: [row.lng, row.lat] as [number, number],
            }));
    }

    const response = await fetch(
        "https://www.google.com/maps/d/kml?mid=1m7PlBBSOnA2ymIGxBy9WInAlr3Z6_qdL&forcekml=1",
    );
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for Google Maps KML feed`);
    }

    const kml = await response.text();
    const coordinates = parseBranchCoordinatesKml(kml);

    const syncedAt = new Date().toISOString();
    repos().branchCoordinates.replaceAll(
        coordinates.map(coordinate => ({
            branchName: coordinate.branch,
            lng: coordinate.lngLat[0],
            lat: coordinate.lngLat[1],
            syncedAt,
        })),
    );
    markSynced(source);
    return coordinates;
}

function toMinutes(time: string): number | undefined {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!match) return undefined;

    const hour12 = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    const period = match[3].toUpperCase();

    if (!Number.isFinite(hour12) || !Number.isFinite(minute)) return undefined;
    const hour24 = (hour12 % 12) + (period === "PM" ? 12 : 0);
    return hour24 * 60 + minute;
}

function toMinutesFromIsoDateTime(value: string): number | undefined {
    const match = value.match(/(?:T|\s)(\d{2}):(\d{2})(?::\d{2})?/);
    if (!match) return undefined;
    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return undefined;
    return hour * 60 + minute;
}

/**
 * Parses a wall-clock time to minutes-since-midnight, accepting BOTH the 12-hour ("5:00 PM") and
 * 24-hour ("17:00") forms. The upstream `field_early_closing` feed uses the 12-hour form, so a
 * naive `HH:MM`-only parse silently dropped the meridiem and read "5:00 PM" as 5:00 (AM) — a closing
 * time *before* opening, which zeroed out the whole day's availability (AV-4). Unlike `toMinutes`,
 * the meridiem is optional here so a 24-hour value still parses.
 */
export function parseClockMinutes(value: string): number | undefined {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
    if (!match) return undefined;

    let hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) return undefined;

    const period = match[3]?.toUpperCase();
    if (period) {
        if (hour < 1 || hour > 12) return undefined;
        hour = (hour % 12) + (period === "PM" ? 12 : 0);
    } else if (hour > 23) {
        return undefined;
    }

    return hour * 60 + minute;
}

/**
 * Extracts the "YYYY-MM-DD" calendar-date portion of a reservation timestamp. Needed because
 * `toMinutesFromIsoDateTime` keeps only the time-of-day; without the date, a reservation from a
 * different day would block the same clock-time slot on the searched day (AV-3).
 */
export function dateIsoFromIsoDateTime(value: string): string | undefined {
    return value.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}

function toTimeLabel(minutes: number): string {
    const hour24 = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

type OperatingHours = {
    opening: number | null;
    closing: number | null;
};

// Mirrors live SLR request page logic for location hours by weekday (0=Sun, 6=Sat).
const OPERATING_HOURS_BY_LOCATION: Record<string, Record<number, OperatingHours>> = {
    "183": {
        0: { opening: null, closing: null },
        1: { opening: null, closing: null },
        2: { opening: null, closing: null },
        3: { opening: null, closing: null },
        4: { opening: 12, closing: 17 },
        5: { opening: 12, closing: 17 },
        6: { opening: 12, closing: 17 },
    },
    "194": {
        0: { opening: null, closing: null },
        1: { opening: 9, closing: 15 },
        2: { opening: 9, closing: 20 },
        3: { opening: 9, closing: 20 },
        4: { opening: 9, closing: 15 },
        5: { opening: 9, closing: 17 },
        6: { opening: 10, closing: 17 },
    },
    "205": {
        0: { opening: 12, closing: 17 },
        1: { opening: 9, closing: 20 },
        2: { opening: 9, closing: 20 },
        3: { opening: 9, closing: 20 },
        4: { opening: 9, closing: 20 },
        5: { opening: 9, closing: 17 },
        6: { opening: 10, closing: 17 },
    },
    "209": {
        0: { opening: null, closing: null },
        1: { opening: 9, closing: 20 },
        2: { opening: 9, closing: 20 },
        3: { opening: 9, closing: 20 },
        4: { opening: 9, closing: 20 },
        5: { opening: 9, closing: 17 },
        6: { opening: null, closing: null },
    },
    "3939": {
        0: { opening: 12, closing: 17 },
        1: { opening: 9, closing: 20 },
        2: { opening: 9, closing: 20 },
        3: { opening: 9, closing: 20 },
        4: { opening: 9, closing: 20 },
        5: { opening: 9, closing: 17 },
        6: { opening: 10, closing: 17 },
    },
};

const MR_SUNDAY_OPEN_ROOM_IDS = new Set(["780", "787", "786", "793", "795", "794", "799"]);
const MR_AHC_ROOM_IDS = new Set(["7", "780"]);
const MR_TERRAZAS_ROOM_IDS = new Set(["839", "840", "800"]);
const MR_WMK_ROOM_ID = "807";
const MR_SPECIAL_CLOSED_AFTER = "2024-07-13";
const MR_TERRAZAS_CLOSED_ON_SATURDAY_AFTER = "2023-10-09";
const MR_COMBINED_ROOM_CONFLICTS: Record<string, string[]> = {
    "781": ["848"],
    "782": ["848"],
    "848": ["781", "782"],
    "783": ["850"],
    "849": ["850"],
    "850": ["783", "849"],
    "793": ["794"],
    "795": ["794"],
    "794": ["793", "795"],
    "796": ["797"],
    "798": ["797"],
    "797": ["796", "798"],
    "839": ["800"],
    "840": ["800"],
    "800": ["839", "840"],
    "801": ["802"],
    "803": ["802"],
    "802": ["801", "803"],
    "804": ["805"],
    "806": ["805"],
    "805": ["804", "806"],
    "808": ["809"],
    "810": ["809"],
    "809": ["808", "810"],
};

type SpecialDates = {
    closedDates: Set<string>;
    earlyClosings: Map<string, { hour: number; minute: number }>;
};

export type RoomAvailability = {
    availableStartMinutes: number[];
    availableTimes: string[];
    availableDurations: number[];
};

export function getRoomAvailability(
    room: LiveRoom,
    roomReservations: z.infer<typeof ReservationSchema>[],
    date: Date,
): RoomAvailability {
    // The searched date is a UTC-midnight Date parsed from a "YYYY-MM-DD" calendar date,
    // and dateIso/reservation fetches are all UTC-based. Use getUTCDay() so the weekday
    // matches that calendar date instead of the server's local weekday (off-by-one west of UTC).
    const weekday = date.getUTCDay();
    const hours = OPERATING_HOURS_BY_LOCATION[room.locationId]?.[weekday];
    if (!hours || hours.opening === null || hours.closing === null) {
        return { availableStartMinutes: [], availableTimes: [], availableDurations: [] };
    }

    const openingMinutes = hours.opening * 60;
    const closingMinutes = hours.closing * 60;
    const intervals = roomReservations
        .map(reservation => {
            const start = toMinutesFromIsoDateTime(reservation.start);
            const end = toMinutesFromIsoDateTime(reservation.end);
            if (
                start === undefined ||
                end === undefined ||
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                end <= start
            ) {
                return undefined;
            }
            return {
                start: Math.max(start, openingMinutes),
                end: Math.min(end, closingMinutes),
            };
        })
        .filter((value): value is { start: number; end: number } =>
            Boolean(value && value.end > value.start),
        )
        .sort((left, right) => left.start - right.start);

    const mergedIntervals: Array<{ start: number; end: number }> = [];
    for (const interval of intervals) {
        const previous = mergedIntervals[mergedIntervals.length - 1];
        if (!previous || interval.start > previous.end) {
            mergedIntervals.push(interval);
            continue;
        }

        previous.end = Math.max(previous.end, interval.end);
    }

    const availableStartMinutes: number[] = [];
    const step = 15;
    for (let start = openingMinutes; start + step <= closingMinutes; start += step) {
        const end = start + step;
        const blocked = mergedIntervals.some(
            interval => start < interval.end && end > interval.start,
        );
        if (!blocked) availableStartMinutes.push(start);
    }

    const availableDurations = new Set<number>();
    let runStart: number | undefined;
    let previousStart: number | undefined;

    for (const start of availableStartMinutes) {
        const continuesRun = previousStart !== undefined && start - previousStart === step;
        if (!continuesRun) {
            if (runStart !== undefined && previousStart !== undefined) {
                const runLength = (previousStart - runStart) / step + 1;
                for (let duration = step; duration <= runLength * step; duration += step) {
                    availableDurations.add(duration);
                }
            }
            runStart = start;
        }
        previousStart = start;
    }

    if (runStart !== undefined && previousStart !== undefined) {
        const runLength = (previousStart - runStart) / step + 1;
        for (let duration = step; duration <= runLength * step; duration += step) {
            availableDurations.add(duration);
        }
    }

    return {
        availableStartMinutes,
        availableTimes: availableStartMinutes.map(toTimeLabel),
        availableDurations: Array.from(availableDurations).sort((a, b) => a - b),
    };
}

function getMeetingRoomConflictSet(roomId: string): Set<string> {
    return new Set([roomId, ...(MR_COMBINED_ROOM_CONFLICTS[roomId] ?? [])]);
}

function getMeetingRoomOperatingHours(
    roomId: string,
    date: Date,
    specialDates: SpecialDates,
): OperatingHours | undefined {
    const dateIso = date.toISOString().slice(0, 10);
    if (specialDates.closedDates.has(dateIso)) return undefined;

    // Both "closed after" boundaries below use `>=` (closed *on and after* the boundary date) for a
    // consistent rule. The dates are historical, so every bookable (present/future) search lands on
    // the closed side regardless of the operator — the choice is latent, but kept uniform so the two
    // checks can't drift (AV-6).
    if (roomId === MR_WMK_ROOM_ID && dateIso >= MR_SPECIAL_CLOSED_AFTER) {
        return undefined;
    }

    // Match the UTC dateIso above (getDay() would read the server-local weekday, off-by-one west of UTC).
    const day = date.getUTCDay();
    if (day === 0 && !MR_SUNDAY_OPEN_ROOM_IDS.has(roomId)) {
        return undefined;
    }

    if (MR_AHC_ROOM_IDS.has(roomId) && (day === 1 || day === 2)) {
        return undefined;
    }

    if (
        MR_TERRAZAS_ROOM_IDS.has(roomId) &&
        day === 6 &&
        dateIso >= MR_TERRAZAS_CLOSED_ON_SATURDAY_AFTER
    ) {
        return undefined;
    }

    let hours: OperatingHours;
    if (day === 0 && MR_SUNDAY_OPEN_ROOM_IDS.has(roomId)) {
        hours = {
            opening: 12,
            closing: 17,
        };
    } else {
        if (day === 6) {
            hours = {
                opening: 10,
                closing: 17,
            };
        } else if (day === 5) {
            hours = {
                opening: 9,
                closing: 17,
            };
        } else {
            hours = {
                opening: 9,
                closing: 20,
            };
        }

        if (MR_AHC_ROOM_IDS.has(roomId)) {
            hours = {
                opening: 10,
                closing: 18,
            };
        }
    }

    const earlyClose = specialDates.earlyClosings.get(dateIso);
    if (earlyClose && hours.opening !== null && hours.closing !== null) {
        const earlyClosing = earlyClose.hour + earlyClose.minute / 60;
        // An early closing only ever moves the close *earlier* — never past the normal close, and
        // never to/before opening. A nonsensical value (e.g. a mis-parsed meridiem) is ignored
        // rather than allowed to collapse the day to zero slots (AV-4 guard).
        if (earlyClosing > hours.opening) {
            hours = {
                opening: hours.opening,
                closing: Math.min(hours.closing, earlyClosing),
            };
        }
    }

    return hours;
}

export function getMeetingRoomAvailability(
    roomId: string,
    reservations: z.infer<typeof MeetingRoomReservationSchema>[],
    date: Date,
    specialDates: SpecialDates,
): RoomAvailability {
    const hours = getMeetingRoomOperatingHours(roomId, date, specialDates);
    if (!hours || hours.opening === null || hours.closing === null) {
        return { availableStartMinutes: [], availableTimes: [], availableDurations: [] };
    }

    const openingMinutes = Math.round(hours.opening * 60);
    const closingMinutes = Math.round(hours.closing * 60);
    const intervals = reservations
        .map(reservation => {
            const start = toMinutesFromIsoDateTime(reservation.start);
            const end = toMinutesFromIsoDateTime(reservation.end);
            if (
                start === undefined ||
                end === undefined ||
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                end <= start
            ) {
                return undefined;
            }
            return {
                start: Math.max(start, openingMinutes),
                end: Math.min(end, closingMinutes),
            };
        })
        .filter((value): value is { start: number; end: number } =>
            Boolean(value && value.end > value.start),
        )
        .sort((left, right) => left.start - right.start);

    const mergedIntervals: Array<{ start: number; end: number }> = [];
    for (const interval of intervals) {
        const previous = mergedIntervals[mergedIntervals.length - 1];
        if (!previous || interval.start > previous.end) {
            mergedIntervals.push(interval);
            continue;
        }

        previous.end = Math.max(previous.end, interval.end);
    }

    const availableStartMinutes: number[] = [];
    const step = 15;
    for (let start = openingMinutes; start + step <= closingMinutes; start += step) {
        const end = start + step;
        const blocked = mergedIntervals.some(
            interval => start < interval.end && end > interval.start,
        );
        if (!blocked) availableStartMinutes.push(start);
    }

    const availableDurations = new Set<number>();
    let runStart: number | undefined;
    let previousStart: number | undefined;

    for (const start of availableStartMinutes) {
        const continuesRun = previousStart !== undefined && start - previousStart === step;
        if (!continuesRun) {
            if (runStart !== undefined && previousStart !== undefined) {
                const runLength = (previousStart - runStart) / step + 1;
                for (let duration = step; duration <= runLength * step; duration += step) {
                    availableDurations.add(duration);
                }
            }
            runStart = start;
        }
        previousStart = start;
    }

    if (runStart !== undefined && previousStart !== undefined) {
        const runLength = (previousStart - runStart) / step + 1;
        for (let duration = step; duration <= runLength * step; duration += step) {
            availableDurations.add(duration);
        }
    }

    return {
        availableStartMinutes,
        availableTimes: availableStartMinutes.map(toTimeLabel),
        availableDurations: Array.from(availableDurations).sort((a, b) => a - b),
    };
}

/**
 * Decides whether a room's computed availability satisfies a search request.
 *
 * `availableStartMinutes` already excludes any 15-min slot blocked by a reservation, so this is the
 * single source of truth for "is the room free". The key correctness point (AV-2): when both a start
 * time AND a duration are requested, the room qualifies only if EVERY 15-min slot across the
 * contiguous window `[start, start + duration)` is free — not merely "the start slot is free" plus
 * "some run somewhere that day is long enough", which previously let an overlapping window through.
 */
export function matchesRequestedSlot(
    availability: RoomAvailability,
    desiredMinutes: number | undefined,
    desiredDuration: number | undefined,
): boolean {
    const step = 15;
    const hasDuration = desiredDuration !== undefined && desiredDuration > 0;

    if (desiredMinutes !== undefined) {
        const freeStarts = new Set(availability.availableStartMinutes);
        const span = hasDuration ? desiredDuration : step;
        for (let slot = desiredMinutes; slot < desiredMinutes + span; slot += step) {
            if (!freeStarts.has(slot)) return false;
        }
        return true;
    }

    if (hasDuration) {
        // No specific start requested: any contiguous free run long enough is acceptable.
        return availability.availableDurations.some(duration => duration >= desiredDuration);
    }

    return true;
}

export function getAvailableTimesForDuration(
    availability: RoomAvailability,
    desiredDuration?: number,
): string[] {
    if (
        !Number.isFinite(desiredDuration) ||
        desiredDuration === undefined ||
        desiredDuration <= 15
    ) {
        return availability.availableTimes;
    }

    const freeStarts = new Set(availability.availableStartMinutes);
    return availability.availableTimes.filter((_, index) => {
        const start = availability.availableStartMinutes[index];
        for (let slot = start; slot < start + desiredDuration; slot += 15) {
            if (!freeStarts.has(slot)) return false;
        }
        return true;
    });
}
async function fetchReservationsForDateByLocation(
    baseUrl: string,
    dateIso: string,
    locationId: string,
): Promise<z.infer<typeof ReservationSchema>[]> {
    const host = normalizeBaseUrl(baseUrl);
    // Upstream reservations are volatile (the old cache was 60s) and not part of the normalized
    // read-model, so they are fetched live per search rather than persisted.
    const payload = await fetchJson<unknown>(
        `${host}/slr_dates2.json?date=${dateIso}&location=${locationId}&t=${Date.now()}`,
    );

    return z.array(ReservationSchema).parse(payload);
}

async function fetchSpecialDates(baseUrl = DEFAULT_BASE_URL): Promise<SpecialDates> {
    const host = normalizeBaseUrl(baseUrl);
    const source = `special_dates:${host}`;
    if (isFresh(source)) {
        return specialDatesFromRows(repos().specialDates.list());
    }

    const payload = await fetchJson<unknown>(
        `${host}/admin/special-dates.json?_format=json&t=${Date.now()}`,
    );

    const closedDates = new Set<string>();
    const earlyClosings = new Map<string, { hour: number; minute: number }>();
    if (Array.isArray(payload)) {
        for (const row of payload) {
            if (!row || typeof row !== "object") continue;
            const data = row as Record<string, unknown>;
            const specialDateRaw =
                typeof data.field_special_date === "string"
                    ? data.field_special_date
                    : typeof (data.field_special_date as { value?: unknown })?.value === "string"
                      ? String((data.field_special_date as { value?: unknown }).value)
                      : undefined;
            const dateMatch = specialDateRaw?.match(/\b\d{4}-\d{2}-\d{2}\b/);
            const dateIso = dateMatch?.[0];
            if (!dateIso) continue;

            const earlyRaw =
                typeof data.field_early_closing === "string"
                    ? data.field_early_closing.trim()
                    : typeof (data.field_early_closing as { value?: unknown })?.value === "string"
                      ? String((data.field_early_closing as { value?: unknown }).value).trim()
                      : "";

            if (!earlyRaw) {
                closedDates.add(dateIso);
                continue;
            }

            // Pull the time token out of whatever surrounds it ("Closes at 5:00 PM") and parse it
            // through the meridiem-aware parser so "5:00 PM" becomes 17:00, not 5:00 (AV-4).
            const timeToken = earlyRaw.match(/\d{1,2}:\d{2}\s*(?:[AP]M)?/i)?.[0];
            const earlyMinutes = timeToken ? parseClockMinutes(timeToken) : undefined;
            if (earlyMinutes === undefined) continue;
            const hour = Math.floor(earlyMinutes / 60);
            const minute = earlyMinutes % 60;

            const previous = earlyClosings.get(dateIso);
            if (!previous || hour * 60 + minute < previous.hour * 60 + previous.minute) {
                earlyClosings.set(dateIso, { hour, minute });
            }
        }
    }

    const syncedAt = new Date().toISOString();
    // A date that is both closed and early-closing collapses to `closed` (the PK is the date, and
    // `getMeetingRoomOperatingHours` checks closed first), matching the prior precedence.
    const dates = new Set<string>([...closedDates, ...earlyClosings.keys()]);
    const rows: NewSpecialDate[] = Array.from(dates).map(date => {
        if (closedDates.has(date)) {
            return { date, closed: true, earlyCloseMinute: null, syncedAt };
        }
        const early = earlyClosings.get(date)!;
        return { date, closed: false, earlyCloseMinute: early.hour * 60 + early.minute, syncedAt };
    });
    repos().specialDates.replaceAll(rows);
    markSynced(source);

    return {
        closedDates,
        earlyClosings,
    };
}

/** Rebuilds the in-memory {@link SpecialDates} (closed set + early-closing map) from table rows. */
function specialDatesFromRows(
    rows: Array<{ date: string; closed: boolean; earlyCloseMinute: number | null }>,
): SpecialDates {
    const closedDates = new Set<string>();
    const earlyClosings = new Map<string, { hour: number; minute: number }>();
    for (const row of rows) {
        if (row.closed) {
            closedDates.add(row.date);
        } else if (row.earlyCloseMinute != null) {
            earlyClosings.set(row.date, {
                hour: Math.floor(row.earlyCloseMinute / 60),
                minute: row.earlyCloseMinute % 60,
            });
        }
    }
    return { closedDates, earlyClosings };
}

async function fetchMeetingRoomReservationsForLocation(
    baseUrl: string,
    dateIso: string,
    locationId: string,
): Promise<z.infer<typeof MeetingRoomReservationSchema>[]> {
    const host = normalizeBaseUrl(baseUrl);
    const date = new Date(`${dateIso}T12:00:00Z`);
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextDateIso = nextDate.toISOString().slice(0, 10);

    // Live fetch (see fetchReservationsForDateByLocation): volatile, not part of the read-model.
    const payload = await fetchJson<unknown>(
        `${host}/mr_dates2.json?sid=999999&loc=${encodeURIComponent(
            locationId,
        )}&date11=${dateIso}&date22=${nextDateIso}&t=${Date.now()}`,
    );

    return z.array(MeetingRoomReservationSchema).parse(payload);
}

function toLibraryRoom(room: LiveRoom, targetDateIso: string): LibraryRoom {
    const location = LocationInfoById[room.locationId as LocationId] ?? {
        name: `Location ${room.locationId}`,
        address: "Unknown",
        image: room.image,
    };

    return {
        branch: {
            name: location.name,
            floor: room.floor,
            address: location.address,
            image: room.image || location.image,
        },
        info: {
            id: room.roomId,
            name: room.name,
            type: "shared-learning-room",
            capacity: room.capacity,
            amenities: room.amenities,
            availableTimes: [],
            availableDurations: [],
            date: targetDateIso,
        },
    };
}

function toMeetingLibraryRoom(
    locationId: string,
    room: MeetingRoomInventoryRoom,
    availability: RoomAvailability,
    targetDateIso: string,
    desiredDuration?: number,
): LibraryRoom {
    const location = LocationInfoById[locationId as LocationId];

    return {
        branch: {
            name: room.branch || location?.name || `Location ${locationId}`,
            floor: room.floor,
            address: location?.address ?? "",
            image: room.image || location?.image || "",
        },
        info: {
            id: room.roomId,
            name: room.name,
            type: "meeting-room",
            capacity: room.capacity,
            amenities: room.amenities,
            availableTimes: getAvailableTimesForDuration(availability, desiredDuration),
            availableDurations: availability.availableDurations,
            date: targetDateIso,
        },
    };
}

export const apl = {
    async getRooms(
        options: Partial<SearchOptions> = {},
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LibraryRoom[]>> {
        try {
            const date = options.date ?? new Date();
            const dateIso = date.toISOString().split("T")[0];
            const desiredMinutes = options.time ? toMinutes(options.time) : undefined;
            const desiredDuration = Number.isFinite(options.duration)
                ? options.duration
                : undefined;

            const liveRooms = await fetchLiveRooms(baseUrl);

            let publishedRooms = liveRooms.filter(room => room.published);

            if (options.location) {
                const needle = options.location.toLowerCase();
                publishedRooms = publishedRooms.filter(room => {
                    const locationName =
                        LocationInfoById[room.locationId as LocationId]?.name ??
                        `Location ${room.locationId}`;
                    return (
                        locationName.toLowerCase().includes(needle) ||
                        room.locationId.toLowerCase() === needle
                    );
                });
            }

            if (options.capacity !== undefined) {
                publishedRooms = publishedRooms.filter(room => room.capacity >= options.capacity!);
            }

            publishedRooms = publishedRooms.filter(room =>
                matchesRequestedAmenities(room.amenities, options.amenities),
            );

            const locationIds = Array.from(new Set(publishedRooms.map(room => room.locationId)));
            const reservationsByLocation = new Map<string, z.infer<typeof ReservationSchema>[]>(
                await mapWithConcurrency(
                    locationIds,
                    RESERVATIONS_FETCH_CONCURRENCY,
                    async locationId => [
                        locationId,
                        await fetchReservationsForDateByLocation(baseUrl, dateIso, locationId),
                    ],
                ),
            );

            const roomsWithAvailability = publishedRooms.map(room => {
                const reservations = reservationsByLocation.get(room.locationId) ?? [];
                const roomReservations = reservations.filter(res => res.room === room.roomId);
                const availability = getRoomAvailability(room, roomReservations, date);
                const libraryRoom = toLibraryRoom(room, dateIso);
                return {
                    ...libraryRoom,
                    info: {
                        ...libraryRoom.info,
                        availableTimes: getAvailableTimesForDuration(availability, desiredDuration),
                        availableDurations: availability.availableDurations,
                    },
                    _availability: availability,
                    _roomReservations: roomReservations,
                };
            });

            const filteredRooms = roomsWithAvailability.filter(room =>
                matchesRequestedSlot(room._availability, desiredMinutes, desiredDuration),
            );

            return {
                data: filteredRooms.map(
                    ({ _availability: _, _roomReservations: __, ...room }) => room,
                ),
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getMeetingRooms(
        options: Partial<SearchOptions> = {},
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LibraryRoom[]>> {
        try {
            const date = options.date ?? new Date();
            const dateIso = date.toISOString().slice(0, 10);
            const desiredMinutes = options.time ? toMinutes(options.time) : undefined;
            const desiredDuration = Number.isFinite(options.duration)
                ? options.duration
                : undefined;
            const desiredCapacity = Number.isFinite(options.capacity)
                ? options.capacity
                : undefined;
            const [inventory, specialDates] = await Promise.all([
                fetchMeetingRoomInventory(baseUrl),
                fetchSpecialDates(baseUrl),
            ]);
            const locationNeedle = options.location
                ? normalizeMeetingRoomBranchName(options.location)
                : undefined;
            const allowedLocationIds = inventory.locations
                .filter(location => {
                    if (!locationNeedle) return true;
                    const normalizedBranch = normalizeMeetingRoomBranchName(location.branch);
                    return (
                        location.locationId.toLowerCase() === locationNeedle ||
                        branchNeedleMatches(normalizedBranch, locationNeedle)
                    );
                })
                .map(location => location.locationId);
            const reservationsByLocation = new Map<
                string,
                z.infer<typeof MeetingRoomReservationSchema>[]
            >(
                await mapWithConcurrency(
                    allowedLocationIds,
                    RESERVATIONS_FETCH_CONCURRENCY,
                    async locationId => [
                        locationId,
                        await fetchMeetingRoomReservationsForLocation(baseUrl, dateIso, locationId),
                    ],
                ),
            );
            const matchingRooms: LibraryRoom[] = [];

            for (const locationId of allowedLocationIds) {
                const reservations = reservationsByLocation.get(locationId) ?? [];
                const rooms = (inventory.roomsByLocation[locationId] ?? []).filter(room => {
                    if (desiredCapacity !== undefined && room.capacity < desiredCapacity) {
                        return false;
                    }
                    return matchesRequestedAmenities(room.amenities, options.amenities);
                });

                for (const room of rooms) {
                    const conflictSet = getMeetingRoomConflictSet(room.roomId);
                    const conflictingReservations = reservations.filter(
                        reservation =>
                            conflictSet.has(String(reservation.room)) &&
                            dateIsoFromIsoDateTime(reservation.start) === dateIso,
                    );
                    const availability = getMeetingRoomAvailability(
                        room.roomId,
                        conflictingReservations,
                        date,
                        specialDates,
                    );
                    if (!matchesRequestedSlot(availability, desiredMinutes, desiredDuration)) {
                        continue;
                    }

                    matchingRooms.push(
                        toMeetingLibraryRoom(
                            locationId,
                            room,
                            availability,
                            dateIso,
                            desiredDuration,
                        ),
                    );
                }
            }

            return { data: matchingRooms, error: undefined };
        } catch (error: unknown) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getMeetingRoomAvailabilityByLocation(
        options: Partial<SearchOptions> = {},
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<
        SafeResult<
            Record<
                string,
                {
                    availableTimes: string[];
                    availableDurations: number[];
                }
            >
        >
    > {
        try {
            const date = options.date ?? new Date();
            const dateIso = date.toISOString().slice(0, 10);
            const desiredMinutes = options.time ? toMinutes(options.time) : undefined;
            const desiredDuration = Number.isFinite(options.duration)
                ? options.duration
                : undefined;
            const desiredCapacity = Number.isFinite(options.capacity)
                ? options.capacity
                : undefined;

            const [inventory, specialDates] = await Promise.all([
                fetchMeetingRoomInventory(baseUrl),
                fetchSpecialDates(baseUrl),
            ]);

            const locationNeedle = options.location
                ? normalizeMeetingRoomBranchName(options.location)
                : undefined;
            const allowedLocationIds = new Set(
                inventory.locations
                    .filter(location => {
                        if (!locationNeedle) return true;
                        const normalizedBranch = normalizeMeetingRoomBranchName(location.branch);
                        return (
                            location.locationId.toLowerCase() === locationNeedle ||
                            branchNeedleMatches(normalizedBranch, locationNeedle)
                        );
                    })
                    .map(location => location.locationId),
            );

            const reservationsByLocation = new Map<
                string,
                z.infer<typeof MeetingRoomReservationSchema>[]
            >(
                await mapWithConcurrency(
                    Array.from(allowedLocationIds),
                    RESERVATIONS_FETCH_CONCURRENCY,
                    async locationId => [
                        locationId,
                        await fetchMeetingRoomReservationsForLocation(baseUrl, dateIso, locationId),
                    ],
                ),
            );

            const result: Record<
                string,
                {
                    availableTimes: string[];
                    availableDurations: number[];
                }
            > = {};

            for (const locationId of allowedLocationIds) {
                const rooms = (inventory.roomsByLocation[locationId] ?? []).filter(room => {
                    if (desiredCapacity !== undefined && room.capacity < desiredCapacity) {
                        return false;
                    }
                    return matchesRequestedAmenities(room.amenities, options.amenities);
                });

                if (!rooms.length) continue;

                const reservations = reservationsByLocation.get(locationId) ?? [];
                const locationTimes = new Set<string>();
                const locationDurations = new Set<number>();
                let hasMatchingRoom = false;

                for (const room of rooms) {
                    const conflictSet = getMeetingRoomConflictSet(room.roomId);
                    // The reservations feed is queried over a two-day window (date11..date22), so it
                    // includes next-day rows. Keep only the searched day; otherwise a next-day
                    // reservation at the same clock time would block this day's slots (AV-3).
                    const conflictingReservations = reservations.filter(
                        reservation =>
                            conflictSet.has(String(reservation.room)) &&
                            dateIsoFromIsoDateTime(reservation.start) === dateIso,
                    );

                    const availability = getMeetingRoomAvailability(
                        room.roomId,
                        conflictingReservations,
                        date,
                        specialDates,
                    );

                    for (const time of availability.availableTimes) locationTimes.add(time);
                    for (const duration of availability.availableDurations) {
                        locationDurations.add(duration);
                    }

                    if (matchesRequestedSlot(availability, desiredMinutes, desiredDuration)) {
                        hasMatchingRoom = true;
                    }
                }

                if (!hasMatchingRoom) continue;

                result[locationId] = {
                    availableTimes: Array.from(locationTimes).sort(),
                    availableDurations: Array.from(locationDurations).sort((a, b) => a - b),
                };
            }

            return {
                data: result,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async clearCache(): Promise<void> {
        // Invalidates the scraped read-model + watermarks; leaves app-owned reservations and the
        // seeded reference tables (hours/conflicts/branch paths) intact.
        const r = repos();
        r.rooms.replaceByKind("shared-learning-room", []);
        r.rooms.replaceByKind("meeting-room", []);
        r.branchDirectory.replaceAll([]);
        r.branchCoordinates.replaceAll([]);
        r.specialDates.replaceAll([]);
        r.syncState.clear();
    },

    async getMeetingRoomBranches(
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LiveMeetingRoomBranch[]>> {
        try {
            const branches = await fetchMeetingRoomBranches(baseUrl);
            return {
                data: branches,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getSharedLearningRoomBranches(
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LiveSharedLearningRoomBranch[]>> {
        try {
            const branches = await fetchSharedLearningRoomBranches(baseUrl);
            return {
                data: branches,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getBranchDirectory(
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LiveBranchDirectoryEntry[]>> {
        try {
            const branches = await fetchBranchDirectory(baseUrl);
            return {
                data: branches,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getBranchCoordinates(): Promise<SafeResult<LiveBranchCoordinate[]>> {
        try {
            const coordinates = await fetchBranchCoordinates();
            return {
                data: coordinates,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    async getLocationPathMapping(): Promise<SafeResult<Record<string, string>>> {
        try {
            const mapping = loadLocationPathMapping();
            return {
                data: mapping,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },
};
