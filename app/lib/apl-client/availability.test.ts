import { describe, expect, it } from "vitest";

import type { RoomAvailability } from "./apl-live-client.server";

import {
    branchNeedleMatches,
    dateIsoFromIsoDateTime,
    getMeetingRoomAvailability,
    getAvailableTimesForDuration,
    getRoomAvailability,
    matchesRequestedSlot,
    parseClockMinutes,
    type LiveRoom,
} from "./apl-live-client.server";

const NO_SPECIAL_DATES = { closedDates: new Set<string>(), earlyClosings: new Map() };

// Carver (location 194) is CLOSED Sundays and OPEN Mondays (9:00–15:00) in
// OPERATING_HOURS_BY_LOCATION. 2026-06-22 is a Monday; 2026-06-21 is a Sunday.
const carverRoom: LiveRoom = {
    roomId: "test-room",
    locationId: "194",
    published: true,
    name: "Test Room",
    capacity: 4,
    floor: 1,
    image: "",
    amenities: { airplay: false, hdmi: false, whiteboard: false },
};

describe("getRoomAvailability — AV-1 weekday is derived from the calendar date, not server TZ", () => {
    it("is running under a west-of-UTC timezone (so this test is meaningful)", () => {
        // Sanity: in America/Chicago, the buggy local getDay() of a UTC-midnight Date reports the
        // PRIOR weekday. This is the exact condition AV-1 fixes; assert the env actually exhibits it.
        expect(new Date("2026-06-22").getDay()).toBe(0); // local: Sunday
        expect(new Date("2026-06-22").getUTCDay()).toBe(1); // calendar: Monday
    });

    it("treats Monday 2026-06-22 as OPEN for Carver (regression: was hidden as Sunday)", () => {
        const result = getRoomAvailability(carverRoom, [], new Date("2026-06-22"));
        expect(result.availableStartMinutes.length).toBeGreaterThan(0);
        // Carver Monday opens 9:00 (=540) and closes 15:00 (=900).
        expect(result.availableStartMinutes[0]).toBe(9 * 60);
        expect(result.availableStartMinutes.at(-1)).toBe(15 * 60 - 15);
    });

    it("treats Sunday 2026-06-21 as CLOSED for Carver", () => {
        const result = getRoomAvailability(carverRoom, [], new Date("2026-06-21"));
        expect(result.availableStartMinutes).toEqual([]);
    });
});

describe("matchesRequestedSlot — AV-2 start time + duration require a contiguous free window", () => {
    // Room open 9:00 (540) – 15:00 (900), one reservation 10:00–10:15 (600–615).
    // Free 15-min slots: 540..585 (before), then 615..885 (after the reservation).
    const availability = getRoomAvailability(
        { ...carverRoom },
        [{ room: carverRoom.roomId, start: "2026-06-22T10:00:00", end: "2026-06-22T10:15:00" }],
        new Date("2026-06-22"),
    );

    it("(precondition) the start slot is free and a long run exists later in the day", () => {
        expect(availability.availableStartMinutes).toContain(585); // 9:45 is free
        expect(availability.availableDurations.some(d => d >= 120)).toBe(true); // a >=2h run exists (after 10:15)
    });

    it("rejects a 9:45 + 120min booking because the window crosses the 10:00 reservation", () => {
        // The exact AV-2 repro: previously this passed (start free + some long run existed elsewhere).
        expect(matchesRequestedSlot(availability, 9 * 60 + 45, 120)).toBe(false);
    });

    it("accepts a 9:00 + 45min booking (window 9:00–9:45 is fully free)", () => {
        expect(matchesRequestedSlot(availability, 9 * 60, 45)).toBe(true);
    });

    it("accepts a 10:15 + 120min booking (contiguous free run after the reservation)", () => {
        expect(matchesRequestedSlot(availability, 10 * 60 + 15, 120)).toBe(true);
    });

    it("duration-only (no start time) still matches when any long-enough run exists", () => {
        expect(matchesRequestedSlot(availability, undefined, 120)).toBe(true);
    });

    it("a duration longer than any free run is rejected", () => {
        const tight: RoomAvailability = {
            availableStartMinutes: [540, 555],
            availableTimes: [],
            availableDurations: [15, 30],
        };
        expect(matchesRequestedSlot(tight, undefined, 120)).toBe(false);
        expect(matchesRequestedSlot(tight, 540, 120)).toBe(false);
    });
});

describe("getAvailableTimesForDuration", () => {
    const availability: RoomAvailability = {
        availableStartMinutes: [540, 555, 570, 600],
        availableTimes: ["9:00 AM", "9:15 AM", "9:30 AM", "10:00 AM"],
        availableDurations: [15, 30, 45],
    };

    it("returns only starts followed by enough contiguous free slots", () => {
        expect(getAvailableTimesForDuration(availability, 30)).toEqual(["9:00 AM", "9:15 AM"]);
    });

    it("keeps every available start when no duration is requested", () => {
        expect(getAvailableTimesForDuration(availability)).toEqual(availability.availableTimes);
    });
});

describe("AV-3 — next-day reservations must not block the searched day (meeting rooms)", () => {
    // Room 781 (a normal, non-AHC/non-WMK room) is open Mon 9:00–20:00. 2026-06-22 is a Monday.
    const monday = new Date("2026-06-22");
    const dateIso = "2026-06-22";

    it("dateIsoFromIsoDateTime extracts the calendar date from a reservation timestamp", () => {
        expect(dateIsoFromIsoDateTime("2026-06-23 09:00:00")).toBe("2026-06-23");
        expect(dateIsoFromIsoDateTime("2026-06-22T09:00:00")).toBe("2026-06-22");
        expect(dateIsoFromIsoDateTime("09:00:00")).toBeUndefined();
    });

    it("a SAME-day 9:00–12:00 reservation blocks the 9:00 slot", () => {
        const a = getMeetingRoomAvailability(
            "781",
            [{ room: "781", start: "2026-06-22 09:00:00", end: "2026-06-22 12:00:00" }],
            monday,
            NO_SPECIAL_DATES,
        );
        expect(a.availableStartMinutes).not.toContain(540);
    });

    it("an UNFILTERED next-day reservation would wrongly block 9:00 (demonstrates the trap)", () => {
        const unfiltered = getMeetingRoomAvailability(
            "781",
            [{ room: "781", start: "2026-06-23 09:00:00", end: "2026-06-23 12:00:00" }],
            monday,
            NO_SPECIAL_DATES,
        );
        expect(unfiltered.availableStartMinutes).not.toContain(540);
    });

    it("after the AV-3 date filter, the next-day reservation is dropped and 9:00 is free", () => {
        const raw = [{ room: "781", start: "2026-06-23 09:00:00", end: "2026-06-23 12:00:00" }];
        const sameDayOnly = raw.filter(r => dateIsoFromIsoDateTime(r.start) === dateIso);
        expect(sameDayOnly).toEqual([]);

        const filtered = getMeetingRoomAvailability("781", sameDayOnly, monday, NO_SPECIAL_DATES);
        expect(filtered.availableStartMinutes).toContain(540);
    });
});

describe("parseClockMinutes — AV-4 early-closing times parse meridiem (12h) and 24h alike", () => {
    it("reads a 12-hour PM time as the afternoon, not the morning", () => {
        expect(parseClockMinutes("5:00 PM")).toBe(17 * 60); // the exact AV-4 repro
        expect(parseClockMinutes("5:00PM")).toBe(17 * 60);
        expect(parseClockMinutes("9:00 AM")).toBe(9 * 60);
    });

    it("reads a 24-hour time unchanged", () => {
        expect(parseClockMinutes("17:00")).toBe(17 * 60);
        expect(parseClockMinutes("09:30")).toBe(9 * 60 + 30);
    });

    it("handles the 12/midnight boundaries", () => {
        expect(parseClockMinutes("12:00 AM")).toBe(0);
        expect(parseClockMinutes("12:00 PM")).toBe(12 * 60);
    });

    it("rejects junk", () => {
        expect(parseClockMinutes("")).toBeUndefined();
        expect(parseClockMinutes("17:00 PM")).toBeUndefined(); // hour out of 12h range
        expect(parseClockMinutes("9:60 AM")).toBeUndefined();
        expect(parseClockMinutes("noon")).toBeUndefined();
    });
});

describe("getMeetingRoomAvailability — AV-4 early closing trims the day instead of wiping it", () => {
    // Room 781, Monday 2026-06-22, normal hours 9:00–20:00 (540–1200).
    const monday = new Date("2026-06-22");
    const withEarlyClose = (hour: number, minute: number) => ({
        closedDates: new Set<string>(),
        earlyClosings: new Map([["2026-06-22", { hour, minute }]]),
    });

    it("a 5:00 PM early close ends availability at 16:45, not zero (regression)", () => {
        const a = getMeetingRoomAvailability("781", [], monday, withEarlyClose(17, 0));
        expect(a.availableStartMinutes.length).toBeGreaterThan(0);
        expect(a.availableStartMinutes.at(-1)).toBe(17 * 60 - 15); // last 15-min start before 17:00
    });

    it("guards a nonsensical early close before opening (keeps the normal day)", () => {
        const a = getMeetingRoomAvailability("781", [], monday, withEarlyClose(8, 0));
        expect(a.availableStartMinutes.at(-1)).toBe(20 * 60 - 15); // unchanged: still closes 20:00
    });

    it("never *extends* the day past the normal close", () => {
        const a = getMeetingRoomAvailability("781", [], monday, withEarlyClose(22, 0));
        expect(a.availableStartMinutes.at(-1)).toBe(20 * 60 - 15);
    });
});

describe("branchNeedleMatches — AV-5 an empty normalized name must not match every branch", () => {
    it("matches identical and substring branch names", () => {
        expect(branchNeedleMatches("carver branch", "carver branch")).toBe(true);
        expect(branchNeedleMatches("austin history center", "austin history")).toBe(true);
    });

    it("does NOT match when either side is empty (the AV-5 trap)", () => {
        // "(North Village)" / "- Capacity: 10" normalize to "", and every string .includes("").
        expect(branchNeedleMatches("carver branch", "")).toBe(false);
        expect(branchNeedleMatches("", "carver branch")).toBe(false);
        expect(branchNeedleMatches("", "")).toBe(false);
    });

    it("does not match unrelated branches", () => {
        expect(branchNeedleMatches("carver branch", "terrazas branch")).toBe(false);
    });
});
