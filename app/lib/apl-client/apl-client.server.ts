import { openKv } from "@deno/kv";
import validator from "validator";
import { z } from "zod";
import jsonRooms from "../../data/library.json";
import { randomDelay } from "../random-delay";
import {
    CancellationFailedError,
    NoAvailableTimesError,
    ReservationDataMismatchError,
    ReservationNotFoundError,
    RoomAlreadyReservedError,
    RoomNotAvailableAtTimeError,
    RoomNotAvailableOnDateError,
    RoomNotFoundError,
    RoomTypeMismatchError,
} from "./errors";

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
    floor: number;
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
        amenities: Amenities;
        availableTimes: string[];
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
    capacity?: number;
    amenities?: Partial<Amenities>;
};

/**
 * Schema for validating shared learning room reservation options.
 */
export const SharedLearningRoomReservationOptionsSchema = z.object({
    roomId: z.string(),
    meetingTopic: z.string(),
    fullName: z.string(),
    emailAddress: z.string().email(),
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
        website: z.string().url().optional(),
        phoneNumber: z.string().refine(value => validator.isMobilePhone(value, "any")),
    });

/**
 * Union schema for validating reservation options for any room type.
 */
export const ReservationOptionsSchema = z.union([
    MeetingRoomReservationOptionsSchema.extend({ roomType: z.literal("meeting-room") }),
    SharedLearningRoomReservationOptionsSchema.extend({
        roomType: z.literal("shared-learning-room"),
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
    roomType: "shared-learning-room" | "meeting-room";
    roomName: string;
    branchName: string;
    // Optional fields for meeting rooms
    orgName?: string;
    orgPurpose?: string;
    website?: string;
    phoneNumber?: string;
};

const TIMEOUT = 2000;
const ROOMS = jsonRooms as LibraryRoom[];

// Open the KV store
const kv = await openKv();

// Load ROOMS into the KV store if not already loaded
await Promise.all(
    ROOMS.map(async room => {
        const roomKey = ["rooms", room.info.id];
        const existingRoom = await kv.get(roomKey);
        if (!existingRoom.value) {
            await kv.set(roomKey, room);
        }
    }),
);

/**
 * Austin Public Library API for managing room reservations.
 */
export const apl = {
    /**
     * Retrieves available library rooms based on search options.
     * @param options - Search criteria for filtering rooms.
     * @param timeout - Optional timeout in milliseconds.
     * @returns A SafeResult containing an array of LibraryRoom or an AplError.
     */
    async getRooms(
        options: Partial<SearchOptions> = {},
        timeout = TIMEOUT,
    ): Promise<SafeResult<LibraryRoom[]>> {
        await randomDelay(timeout);

        try {
            // Fetch all rooms from KV store
            const rooms = kv.list<LibraryRoom>({ prefix: ["rooms"] });
            const filteredRooms: LibraryRoom[] = [];
            for await (const { value: room } of rooms) {
                // Check if room is available (i.e., not reserved at the specified date and time)
                let isAvailable = true;
                if (options.date && options.time) {
                    const reservationKey = [
                        "reservations",
                        room.info.id,
                        options.date.toISOString().split("T")[0],
                        options.time,
                    ];
                    const reservation = await kv.get(reservationKey);
                    if (reservation.value) {
                        isAvailable = false;
                    }
                }

                if (
                    (!options.amenities ||
                        Object.entries(options.amenities).every(
                            ([key, value]) => room.info.amenities[key as keyof Amenities] === value,
                        )) &&
                    (options.capacity === undefined || room.info.capacity >= options.capacity) &&
                    (!options.date ||
                        new Date(room.info.date).toDateString() === options.date.toDateString()) &&
                    (!options.location || options.location === room.branch.name) &&
                    isAvailable
                ) {
                    filteredRooms.push(room);
                }
            }

            return {
                data: filteredRooms,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(`${error}`),
            };
        }
    },

    /**
     * Reserves a library room based on the provided reservation options.
     * @param options - Reservation details conforming to the ReservationOptionsSchema.
     * @param timeout - Optional timeout in milliseconds.
     * @returns A SafeResult containing the Reservation or an AplError.
     */
    async reserveRoom(
        options: z.infer<typeof ReservationOptionsSchema>,
        timeout = TIMEOUT,
    ): Promise<SafeResult<Reservation>> {
        await randomDelay(timeout);

        try {
            // Validate input using Zod
            const validatedOptions = ReservationOptionsSchema.parse(options);

            // Find the room in KV store
            const roomKey = ["rooms", validatedOptions.roomId];
            const roomEntry = await kv.get<LibraryRoom>(roomKey);
            const room = roomEntry.value;
            const roomVersionstamp = roomEntry.versionstamp;

            if (!room) {
                return {
                    data: undefined,
                    error: new RoomNotFoundError(validatedOptions.roomId),
                };
            }

            // Check if room type matches
            if (room.info.type !== validatedOptions.roomType) {
                return {
                    data: undefined,
                    error: new RoomTypeMismatchError(validatedOptions.roomType, room.info.type),
                };
            }

            // Check date availability
            if (room.info.date !== validatedOptions.date) {
                return {
                    data: undefined,
                    error: new RoomNotAvailableOnDateError(validatedOptions.date),
                };
            }

            // Check time availability
            if (!room.info.availableTimes.includes(validatedOptions.time)) {
                return {
                    data: undefined,
                    error: new RoomNotAvailableAtTimeError(validatedOptions.time),
                };
            }

            // Remove the reserved time slot from room's availableTimes
            const updatedAvailableTimes = room.info.availableTimes.filter(
                t => t !== validatedOptions.time,
            );

            // If no available times left
            if (updatedAvailableTimes.length === 0) {
                return {
                    data: undefined,
                    error: new NoAvailableTimesError(),
                };
            }

            // Update the room's availableTimes
            room.info.availableTimes = updatedAvailableTimes;

            // Construct reservation key
            const reservationKey = [
                "reservations",
                room.info.id,
                validatedOptions.date,
                validatedOptions.time,
            ];

            // Start atomic transaction
            const atomic = kv.atomic();

            // Check if the reservation already exists
            atomic.check({ key: reservationKey, versionstamp: null });

            // Check room's versionstamp to ensure no concurrent modifications
            atomic.check({ key: roomKey, versionstamp: roomVersionstamp });

            // Set the updated room
            atomic.set(roomKey, room);

            // Create reservation object
            const reservation: Reservation = {
                ...validatedOptions,
                roomName: room.info.name,
                branchName: room.branch.name,
            };

            // Set the reservation
            atomic.set(reservationKey, reservation);

            // Commit the transaction
            const res = await atomic.commit();

            if (!res.ok) {
                return {
                    data: undefined,
                    error: new RoomAlreadyReservedError(),
                };
            }

            return {
                data: reservation,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(`${error}`),
            };
        }
    },

    /**
     * Cancels an existing reservation.
     * @param reservation - The reservation to cancel.
     * @param timeout - Optional timeout in milliseconds.
     * @returns A SafeResult containing the canceled Reservation or an AplError.
     */
    async cancelReservation(
        reservation: Reservation,
        timeout = TIMEOUT,
    ): Promise<SafeResult<Reservation>> {
        await randomDelay(timeout);

        try {
            // Construct reservation key
            const reservationKey = [
                "reservations",
                reservation.roomId,
                reservation.date,
                reservation.time,
            ];

            // Find the reservation in KV store
            const reservationEntry = await kv.get<Reservation>(reservationKey);
            const existingReservation = reservationEntry.value;
            const reservationVersionstamp = reservationEntry.versionstamp;

            if (!existingReservation) {
                return {
                    data: undefined,
                    error: new ReservationNotFoundError(),
                };
            }

            // Ensure the reservation matches the provided reservation
            if (JSON.stringify(existingReservation) !== JSON.stringify(reservation)) {
                return {
                    data: undefined,
                    error: new ReservationDataMismatchError(),
                };
            }

            // Get the room
            const roomKey = ["rooms", reservation.roomId];
            const roomEntry = await kv.get<LibraryRoom>(roomKey);
            const room = roomEntry.value;
            const roomVersionstamp = roomEntry.versionstamp;

            if (!room) {
                return {
                    data: undefined,
                    error: new RoomNotFoundError(reservation.roomId),
                };
            }

            // Add the cancelled time back to availableTimes
            room.info.availableTimes.push(reservation.time);
            // Optionally, sort the availableTimes
            room.info.availableTimes.sort();

            // Start atomic transaction
            const atomic = kv.atomic();

            // Check the reservation versionstamp to ensure no concurrent modifications
            atomic.check({ key: reservationKey, versionstamp: reservationVersionstamp });

            // Check the room's versionstamp
            atomic.check({ key: roomKey, versionstamp: roomVersionstamp });

            // Delete the reservation
            atomic.delete(reservationKey);

            // Update the room
            atomic.set(roomKey, room);

            // Commit the transaction
            const res = await atomic.commit();

            if (!res.ok) {
                return {
                    data: undefined,
                    error: new CancellationFailedError(),
                };
            }

            return {
                data: reservation,
                error: undefined,
            };
        } catch (error: any) {
            return {
                data: undefined,
                error: error instanceof Error ? error : new Error(`${error}`),
            };
        }
    },
};
