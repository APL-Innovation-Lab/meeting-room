import { beforeEach, describe, expect, it } from "vitest";

import {
    CancellationFailedError,
    ReservationNotFoundError,
    RoomAlreadyReservedError,
} from "../errors";
import { createDatabase, Repos } from "./client.server";
import { type CreateReservationInput } from "./repos";

// Each test gets a fresh in-memory database (migrations applied from ./drizzle), wired through its own
// Repos container — so cases are fully isolated and never touch the on-disk app database.
let repos: Repos;
beforeEach(() => {
    repos = new Repos(createDatabase(":memory:"));
});

const baseBooking: CreateReservationInput = {
    roomId: "781",
    roomKind: "meeting-room",
    roomName: "Conference Room A",
    branchName: "Central Library",
    meetingTopic: "Team sync",
    fullName: "Ada Lovelace",
    emailAddress: "ada@example.com",
    date: "2026-06-25",
    time: "5:00 PM",
    orgName: "Analytical Engines",
    orgPurpose: "Planning",
    website: "https://example.com",
    phoneNumber: "+15125551234",
};

describe("ReservationsRepo.create", () => {
    it("persists a booking and returns it with a generated id and confirmed status", () => {
        const created = repos.reservations.create(baseBooking);
        expect(created.id).toBeGreaterThan(0);
        expect(created.status).toBe("confirmed");
        expect(created.createdAt).toBeTruthy();
        expect(repos.reservations.get(created.id).meetingTopic).toBe("Team sync");
    });

    it("rejects a second booking of the same room/date/slot (the unique-slot constraint)", () => {
        repos.reservations.create(baseBooking);
        expect(() => repos.reservations.create(baseBooking)).toThrow(RoomAlreadyReservedError);
    });

    it("allows the same room at a different time", () => {
        repos.reservations.create(baseBooking);
        expect(() => repos.reservations.create({ ...baseBooking, time: "6:00 PM" })).not.toThrow();
    });

    it("allows a different room at the same time", () => {
        repos.reservations.create(baseBooking);
        expect(() => repos.reservations.create({ ...baseBooking, roomId: "782" })).not.toThrow();
    });

    it("allows a shared-learning booking with the meeting-room-only fields omitted", () => {
        const slr: CreateReservationInput = {
            roomId: "slr-1",
            roomKind: "shared-learning-room",
            roomName: "Study Room 1",
            branchName: "Ruiz Branch",
            meetingTopic: "Study group",
            fullName: "Grace Hopper",
            emailAddress: "grace@example.com",
            date: "2026-06-25",
            time: "10:00 AM",
        };
        const created = repos.reservations.create(slr);
        expect(created.orgName).toBeNull();
        expect(created.roomKind).toBe("shared-learning-room");
    });
});

describe("ReservationsRepo.cancel", () => {
    it("cancels a confirmed booking and frees the slot for re-booking", () => {
        const created = repos.reservations.create(baseBooking);
        const cancelled = repos.reservations.cancel(created.id);
        expect(cancelled.status).toBe("cancelled");
        // Slot is free again now that the prior booking left the partial unique index.
        expect(() => repos.reservations.create(baseBooking)).not.toThrow();
    });

    it("throws ReservationNotFoundError for an unknown id", () => {
        expect(() => repos.reservations.cancel(9999)).toThrow(ReservationNotFoundError);
    });

    it("throws CancellationFailedError when cancelling an already-cancelled booking", () => {
        const created = repos.reservations.create(baseBooking);
        repos.reservations.cancel(created.id);
        expect(() => repos.reservations.cancel(created.id)).toThrow(CancellationFailedError);
    });
});

describe("ReservationsRepo.get / list", () => {
    it("throws ReservationNotFoundError for a missing reservation", () => {
        expect(() => repos.reservations.get(1)).toThrow(ReservationNotFoundError);
    });

    it("filters by room, date, and status", () => {
        const a = repos.reservations.create(baseBooking);
        repos.reservations.create({ ...baseBooking, roomId: "782", time: "6:00 PM" });
        repos.reservations.cancel(a.id);

        expect(repos.reservations.list()).toHaveLength(2);
        expect(repos.reservations.list({ roomId: "782" })).toHaveLength(1);
        expect(repos.reservations.list({ status: "confirmed" })).toHaveLength(1);
        expect(repos.reservations.list({ status: "cancelled" })).toHaveLength(1);
        expect(repos.reservations.list({ date: "2026-06-25", roomId: "781" })).toHaveLength(1);
    });
});

describe("ReservationsRepo — partial unique index correctness", () => {
    it("lets multiple cancelled rows for the same slot coexist", () => {
        const a = repos.reservations.create(baseBooking);
        repos.reservations.cancel(a.id);
        const b = repos.reservations.create(baseBooking); // slot freed by the cancel
        repos.reservations.cancel(b.id);

        // Two rows now share (room, date, time) — allowed because the unique index only indexes
        // confirmed rows. This is the property that makes re-booking a cancelled slot possible.
        const sameSlot = repos.reservations
            .list({ roomId: baseBooking.roomId, date: baseBooking.date })
            .filter(r => r.time === baseBooking.time);
        expect(sameSlot).toHaveLength(2);
        expect(sameSlot.every(r => r.status === "cancelled")).toBe(true);
    });

    it("supports repeated book → cancel → re-book cycles on one slot", () => {
        for (let i = 0; i < 3; i++) {
            const created = repos.reservations.create(baseBooking);
            expect(created.status).toBe("confirmed");
            repos.reservations.cancel(created.id);
        }
        expect(repos.reservations.list({ status: "confirmed" })).toHaveLength(0);
        expect(repos.reservations.list({ status: "cancelled" })).toHaveLength(3);
    });

    it("constrains the EXACT start-slot only — it does NOT detect overlapping times", () => {
        // Documenting intended behavior: the constraint is on the (room, date, time) start label,
        // not on time-range overlap. A 5:15 PM booking is independent of a 5:00 PM one.
        repos.reservations.create(baseBooking);
        expect(() => repos.reservations.create({ ...baseBooking, time: "5:15 PM" })).not.toThrow();
    });
});
