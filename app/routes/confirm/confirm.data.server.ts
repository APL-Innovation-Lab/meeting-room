import type { Room } from "~/lib/room";

import { apl, parseClockMinutes, type Reservation } from "~/lib/apl-client/apl-live-client.server";
import { ReservationNotFoundError } from "~/lib/apl-client/errors";
import { getGoogleCalendarUrl, getICSDownloadUrl, getYahooCalendarUrl } from "~/utils/calendar";

import { formatReviewDate, formatTimeRange } from "../review/review.data.server";

/** Everything the confirmation page renders about a booked reservation, shaped server-side. */
export type ReservationConfirmation = {
    id: number;
    roomKind: Room.Kind;
    roomName: string;
    branchName: string;
    branchAddress: string;
    capacity: number;
    dateLabel: string;
    timeLabel: string;
    /** Present only for shared-learning rooms; meeting-room requests await staff confirmation. */
    calendarLinks?: CalendarLinks;
};

export type CalendarLinks = { google: string; yahoo: string; ics: string };

/**
 * Loads the persisted reservation behind `?reservationId=` and shapes it for display, or
 * `undefined` when no such reservation exists (the caller redirects home). Any other database
 * failure propagates — a broken store must not masquerade as a missing booking.
 */
export async function loadReservationConfirmation(
    reservationId: number,
    origin: string,
): Promise<ReservationConfirmation | undefined> {
    const result = await apl.getReservation(reservationId);
    if (result.error instanceof ReservationNotFoundError) return undefined;
    if (result.error) throw result.error;
    return createReservationConfirmation(result.data, origin);
}

export function createReservationConfirmation(
    reservation: Reservation & { id: number },
    origin: string,
): ReservationConfirmation {
    return {
        id: reservation.id,
        roomKind: reservation.roomKind,
        roomName: reservation.roomName,
        branchName: reservation.branchName,
        branchAddress: reservation.branchAddress,
        capacity: reservation.capacity,
        dateLabel: formatReviewDate(reservation.date),
        timeLabel: formatTimeRange(reservation.time, reservation.durationMinutes),
        calendarLinks:
            reservation.roomKind === "shared-learning-room"
                ? createCalendarLinks(reservation, origin)
                : undefined,
    };
}

function createCalendarLinks(reservation: Reservation, origin: string): CalendarLinks | undefined {
    const startMinutes = parseClockMinutes(reservation.time);
    if (startMinutes === undefined) return undefined;

    const start = austinDateTime(reservation.date, startMinutes);
    const event = {
        title: `${reservation.branchName}, ${reservation.roomName}`,
        description: `Shared Learning Room reservation at ${reservation.branchName}`,
        location: reservation.branchAddress,
        start,
        end: new Date(start.getTime() + reservation.durationMinutes * 60_000),
    };

    return {
        google: getGoogleCalendarUrl(event),
        yahoo: getYahooCalendarUrl(event),
        ics: getICSDownloadUrl({ ...event, baseUrl: origin }),
    };
}

// Reservations store Austin wall-clock times; calendar exports need absolute instants, and the
// UTC offset flips with daylight saving.
const AUSTIN_TIME_ZONE = "America/Chicago";

const utcOffsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: AUSTIN_TIME_ZONE,
    timeZoneName: "longOffset",
});

/**
 * The UTC offset in effect in Austin on the given date, e.g. "-05:00" during daylight saving.
 * Probed at noon UTC (early morning in Austin) so the 2 AM local DST switch never straddles the
 * sample for daytime library hours.
 */
function austinUtcOffset(isoDate: string): string {
    const timeZoneName = utcOffsetFormatter
        .formatToParts(new Date(`${isoDate}T12:00:00Z`))
        .find(part => part.type === "timeZoneName")?.value;
    if (!timeZoneName?.startsWith("GMT-")) {
        throw new Error(`Unexpected Austin UTC offset: ${timeZoneName}`);
    }
    return timeZoneName.slice(3);
}

/** An Austin wall-clock time ("YYYY-MM-DD" plus minutes since midnight) as an absolute Date. */
export function austinDateTime(isoDate: string, minutesSinceMidnight: number): Date {
    const hours = String(Math.trunc(minutesSinceMidnight / 60)).padStart(2, "0");
    const minutes = String(minutesSinceMidnight % 60).padStart(2, "0");
    return new Date(`${isoDate}T${hours}:${minutes}:00${austinUtcOffset(isoDate)}`);
}
