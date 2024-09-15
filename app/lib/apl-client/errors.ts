/**
 * Error thrown when a room is not found.
 */
export class RoomNotFoundError extends Error {
    constructor(public roomId: string) {
        super(`Room with ID ${roomId} not found.`);
    }
}

/**
 * Error thrown when there is a mismatch in room types.
 */
export class RoomTypeMismatchError extends TypeError {
    constructor(
        public expectedType: string,
        public actualType: string,
    ) {
        super(`Expected room type "${expectedType}", but got "${actualType}".`);
    }
}

/**
 * Error thrown when a room is not available on a selected date.
 */
export class RoomNotAvailableOnDateError extends Error {
    constructor(public date: string) {
        super(`Room not available on the selected date: ${date}.`);
    }
}

/**
 * Error thrown when a room is not available at a selected time.
 */
export class RoomNotAvailableAtTimeError extends Error {
    constructor(public time: string) {
        super(`Room not available at the selected time: ${time}.`);
    }
}

/**
 * Error thrown when no available times are left for a room.
 */
export class NoAvailableTimesError extends Error {
    constructor() {
        super(`No available times left for this room.`);
    }
}

/**
 * Error thrown when a room is already reserved.
 */
export class RoomAlreadyReservedError extends Error {
    constructor() {
        super(`Room is already reserved at this date and time.`);
    }
}

/**
 * Error thrown when a reservation is not found.
 */
export class ReservationNotFoundError extends Error {
    constructor() {
        super(`Reservation not found.`);
    }
}

/**
 * Error thrown when reservation data does not match.
 */
export class ReservationDataMismatchError extends Error {
    constructor() {
        super(`Reservation data does not match.`);
    }
}

/**
 * Error thrown when cancellation fails due to concurrent modification.
 */
export class CancellationFailedError extends Error {
    constructor() {
        super(`Failed to cancel reservation due to concurrent modification.`);
    }
}
