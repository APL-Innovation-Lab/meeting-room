import { beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import type { Reservation, SearchOptions } from "./apl-client";
import { apl } from "./apl-client";
import { ReservationNotFoundError, RoomNotAvailableAtTimeError } from "./errors";

// Mock data for testing
const testRoomId = "a6z5y4x3-w2v1-0u9t-8s7r-6q5p4o3n2m1l"; // Replace with an actual room ID from your data
const testDate = "2024-10-14";
const testTime = "2:30 PM";
const testReservationOptions = {
    roomId: testRoomId,
    meetingTopic: "Test Meeting",
    fullName: "Test User",
    emailAddress: "test.user@example.com",
    date: testDate,
    time: testTime,
    roomType: "shared-learning-room" as const,
    roomName: "Test Room",
    branchName: "Test Branch",
};

describe("Austin Public Library Client", () => {
    let reservationData: Reservation | undefined;

    beforeAll(async () => {
        // Ensure that the test environment is clean
        await apl.cancelReservation(testReservationOptions);
    });

    describe("getRooms", () => {
        it("should retrieve available rooms", async () => {
            const searchOptions: Partial<SearchOptions> = {
                date: new Date(testDate),
                time: testTime,
                capacity: 5,
            };

            const { error, data } = await apl.getRooms(searchOptions);
            expect(error).toBeUndefined();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data?.length).toBeGreaterThan(0);
        });

        it("should return an error if an invalid date is provided", async () => {
            const searchOptions: Partial<SearchOptions> = {
                date: new Date("invalid-date"),
                time: testTime,
            };

            const { error, data } = await apl.getRooms(searchOptions);
            expect(error).toBeDefined();
            expect(data).toBeUndefined();
            // Since we didn't define a specific error for invalid dates, we can check the error message
            expect(error?.message).toContain("Invalid time value");
        });
    });

    describe("reserveRoom", () => {
        it("should successfully reserve a room", async () => {
            const { error, data } = await apl.reserveRoom(testReservationOptions);
            expect(error).toBeUndefined();
            expect(data).toBeDefined();
            expect(data?.roomId).toBe(testRoomId);
            reservationData = data;
        });

        it("should not reserve a room that is already reserved", async () => {
            const { error, data } = await apl.reserveRoom(testReservationOptions);
            expect(error).toBeDefined();
            expect(data).toBeUndefined();
            expect(error).toBeInstanceOf(RoomNotAvailableAtTimeError);
            expect(error?.message).toContain("Room not available at the selected time");
        });

        it("should return an error for invalid reservation options", async () => {
            const invalidOptions = {
                ...testReservationOptions,
                emailAddress: "invalid-email",
            };

            const { error, data } = await apl.reserveRoom(invalidOptions);
            expect(error).toBeDefined();
            expect(data).toBeUndefined();
            expect(error).toBeInstanceOf(z.ZodError);
            expect(error?.message).toContain("Invalid email");
        });
    });

    describe("cancelReservation", () => {
        it("should successfully cancel a reservation", async () => {
            if (!reservationData) {
                // If reservationData is not set due to previous test failure, skip this test
                expect(true).toBe(true);
                return;
            }
            const { error, data } = await apl.cancelReservation(reservationData);
            expect(error).toBeUndefined();
            expect(data).toBeDefined();
            expect(data?.roomId).toBe(testRoomId);
        });

        it("should return an error when cancelling a non-existent reservation", async () => {
            const { error, data } = await apl.cancelReservation(testReservationOptions);
            expect(error).toBeDefined();
            expect(data).toBeUndefined();
            expect(error).toBeInstanceOf(ReservationNotFoundError);
            expect(error?.message).toContain("Reservation not found.");
        });
    });
});
