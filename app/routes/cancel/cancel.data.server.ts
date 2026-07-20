import type { Room } from "~/lib/room";

import { apl, type Reservation } from "~/lib/apl-client/apl-live-client.server";
import { ReservationNotFoundError } from "~/lib/apl-client/errors";

import { formatReviewDate, formatTimeRange } from "../review/review.data.server";

/** Everything the cancel pages render about a reservation, shaped server-side. */
export type CancellationDetails = {
    id: number;
    roomKind: Room.Kind;
    roomName: string;
    branchName: string;
    branchAddress: string;
    capacity: number;
    dateLabel: string;
    timeLabel: string;
    /** Gates the flow: the prompt page only cancels `confirmed`, the receipt only shows `cancelled`. */
    status: "confirmed" | "cancelled";
};

/** The `?reservationId=` query param as a positive integer, or `undefined` when absent or mangled. */
export function parseReservationId(url: URL): number | undefined {
    const id = Number.parseInt(url.searchParams.get("reservationId") ?? "", 10);
    return Number.isInteger(id) && id > 0 ? id : undefined;
}

/**
 * Loads the persisted reservation behind `?reservationId=` and shapes it for the cancel pages, or
 * `undefined` when no such reservation exists (the caller redirects home). Any other database
 * failure propagates — a broken store must not masquerade as a missing booking.
 */
export async function loadCancellationDetails(
    reservationId: number,
): Promise<CancellationDetails | undefined> {
    const result = await apl.getReservation(reservationId);
    if (result.error instanceof ReservationNotFoundError) return undefined;
    if (result.error) throw result.error;
    return createCancellationDetails(result.data);
}

export function createCancellationDetails(
    reservation: Reservation & { id: number },
): CancellationDetails {
    return {
        id: reservation.id,
        roomKind: reservation.roomKind,
        roomName: reservation.roomName,
        branchName: reservation.branchName,
        branchAddress: reservation.branchAddress,
        capacity: reservation.capacity,
        dateLabel: formatReviewDate(reservation.date),
        timeLabel: formatTimeRange(reservation.time, reservation.durationMinutes),
        status: reservation.status,
    };
}
