import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import { z } from "zod";
import type { Amenities, LibraryRoom, SafeResult, SearchOptions } from "./apl-client.server";

const DEFAULT_BASE_URL = "https://library.austintexas.gov";
const CACHE_TTL_MS = 5 * 60 * 1000;

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

type LiveRoom = {
    roomId: string;
    locationId: string;
    published: boolean;
    name: string;
    capacity: number;
    floor: number;
    image: string;
    amenities: Amenities;
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

let cachedRooms: LiveRoom[] | undefined;
let cachedRoomsAt = 0;

function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, "");
}

function cleanText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
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

function parseRoomMarkup(markup: string): Omit<LiveRoom, "locationId" | "published"> | undefined {
    const fragment = parseFragment(markup);
    const nodes = walkNodes(fragment);

    const roomRoot = nodes.find(node => {
        if (!isElement(node)) return false;
        const classList = getClassList(node);
        return classList.includes("room-option") && classList.some(className => /^option-\d+$/.test(className));
    });
    if (!roomRoot || !isElement(roomRoot)) return undefined;

    const roomIdClass = getClassList(roomRoot).find(className => /^option-\d+$/.test(className));
    const id = roomIdClass ? roomIdClass.replace("option-", "") : undefined;
    if (!id) return undefined;

    const roomNodes = walkNodes(roomRoot);
    const strong = roomNodes.find(node => isElement(node) && node.tagName === "strong");
    const name = cleanText(strong ? getTextContent(strong) : `Room ${id}`);

    const firstImage = roomNodes.find(node => isElement(node) && node.tagName === "img");
    const image = firstImage && isElement(firstImage) ? cleanText(getAttr(firstImage, "src") ?? "") : "";

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
    if (cachedRooms && now - cachedRoomsAt < CACHE_TTL_MS) {
        return cachedRooms;
    }

    const host = normalizeBaseUrl(baseUrl);

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

    cachedRooms = rooms;
    cachedRoomsAt = now;

    return rooms;
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

function reservationBlocksTime(
    reservation: z.infer<typeof ReservationSchema>,
    desiredMinutes: number,
): boolean {
    const start = new Date(reservation.start);
    const end = new Date(reservation.end);

    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
        return false;
    }

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    return desiredMinutes >= startMinutes && desiredMinutes < endMinutes;
}

async function fetchReservationsForDateByLocation(
    baseUrl: string,
    dateIso: string,
    locationId: string,
): Promise<z.infer<typeof ReservationSchema>[]> {
    const host = normalizeBaseUrl(baseUrl);
    const payload = await fetchJson<unknown>(
        `${host}/slr_dates2.json?date=${dateIso}&location=${locationId}&t=${Date.now()}`,
    );

    return z.array(ReservationSchema).parse(payload);
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
            date: targetDateIso,
        },
    };
}

export const aplLive = {
    async getRooms(
        options: Partial<SearchOptions> = {},
        baseUrl = DEFAULT_BASE_URL,
    ): Promise<SafeResult<LibraryRoom[]>> {
        try {
            const date = options.date ?? new Date();
            const dateIso = date.toISOString().split("T")[0];
            const desiredMinutes = options.time ? toMinutes(options.time) : undefined;

            const liveRooms = await fetchLiveRooms(baseUrl);

            let publishedRooms = liveRooms.filter(room => room.published);

            if (options.location) {
                const needle = options.location.toLowerCase();
                publishedRooms = publishedRooms.filter(room => {
                    const locationName =
                        LocationInfoById[room.locationId as LocationId]?.name ?? `Location ${room.locationId}`;
                    return (
                        locationName.toLowerCase().includes(needle) ||
                        room.locationId.toLowerCase() === needle
                    );
                });
            }

            if (options.capacity !== undefined) {
                publishedRooms = publishedRooms.filter(room => room.capacity >= options.capacity!);
            }

            if (options.amenities) {
                publishedRooms = publishedRooms.filter(room =>
                    Object.entries(options.amenities!).every(([key, value]) => {
                        if (value === undefined) return true;
                        return room.amenities[key as keyof Amenities] === value;
                    }),
                );
            }

            if (desiredMinutes !== undefined) {
                const reservationsByLocation = new Map<string, z.infer<typeof ReservationSchema>[]>();

                for (const room of publishedRooms) {
                    if (reservationsByLocation.has(room.locationId)) continue;
                    const reservations = await fetchReservationsForDateByLocation(
                        baseUrl,
                        dateIso,
                        room.locationId,
                    );
                    reservationsByLocation.set(room.locationId, reservations);
                }

                publishedRooms = publishedRooms.filter(room => {
                    const reservations = reservationsByLocation.get(room.locationId) ?? [];
                    const roomReservations = reservations.filter(res => res.room === room.roomId);
                    return !roomReservations.some(res => reservationBlocksTime(res, desiredMinutes));
                });
            }

            return {
                data: publishedRooms.map(room => toLibraryRoom(room, dateIso)),
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    clearCache(): void {
        cachedRooms = undefined;
        cachedRoomsAt = 0;
    },
};
