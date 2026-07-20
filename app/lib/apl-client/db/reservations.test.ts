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
beforeEach(async () => {
    repos = new Repos(await createDatabase(":memory:"));
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
    it("persists a booking and returns it with a generated id and confirmed status", async () => {
        const created = await repos.reservations.create(baseBooking);
        expect(created.id).toBeGreaterThan(0);
        expect(created.status).toBe("confirmed");
        expect(created.createdAt).toBeTruthy();
        expect((await repos.reservations.get(created.id)).meetingTopic).toBe("Team sync");
    });

    it("rejects a second booking of the same room/date/slot (the unique-slot constraint)", async () => {
        await repos.reservations.create(baseBooking);
        await expect(repos.reservations.create(baseBooking)).rejects.toThrow(
            RoomAlreadyReservedError,
        );
    });

    it("allows the same room at a different time", async () => {
        await repos.reservations.create(baseBooking);
        await expect(
            repos.reservations.create({ ...baseBooking, time: "6:00 PM" }),
        ).resolves.not.toThrow();
    });

    it("allows a different room at the same time", async () => {
        await repos.reservations.create(baseBooking);
        await expect(
            repos.reservations.create({ ...baseBooking, roomId: "782" }),
        ).resolves.not.toThrow();
    });

    it("allows a shared-learning booking with the meeting-room-only fields omitted", async () => {
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
        const created = await repos.reservations.create(slr);
        expect(created.orgName).toBeNull();
        expect(created.roomKind).toBe("shared-learning-room");
    });
});

describe("ReservationsRepo.cancel", () => {
    it("cancels a confirmed booking and frees the slot for re-booking", async () => {
        const created = await repos.reservations.create(baseBooking);
        const cancelled = await repos.reservations.cancel(created.id);
        expect(cancelled.status).toBe("cancelled");
        // Slot is free again now that the prior booking left the partial unique index.
        await expect(repos.reservations.create(baseBooking)).resolves.not.toThrow();
    });

    it("throws ReservationNotFoundError for an unknown id", async () => {
        await expect(repos.reservations.cancel(9999)).rejects.toThrow(ReservationNotFoundError);
    });

    it("throws CancellationFailedError when cancelling an already-cancelled booking", async () => {
        const created = await repos.reservations.create(baseBooking);
        await repos.reservations.cancel(created.id);
        await expect(repos.reservations.cancel(created.id)).rejects.toThrow(
            CancellationFailedError,
        );
    });
});

describe("ReservationsRepo.get / list", () => {
    it("throws ReservationNotFoundError for a missing reservation", async () => {
        await expect(repos.reservations.get(1)).rejects.toThrow(ReservationNotFoundError);
    });

    it("filters by room, date, and status", async () => {
        const a = await repos.reservations.create(baseBooking);
        await repos.reservations.create({ ...baseBooking, roomId: "782", time: "6:00 PM" });
        await repos.reservations.cancel(a.id);

        expect(await repos.reservations.list()).toHaveLength(2);
        expect(await repos.reservations.list({ roomId: "782" })).toHaveLength(1);
        expect(await repos.reservations.list({ status: "confirmed" })).toHaveLength(1);
        expect(await repos.reservations.list({ status: "cancelled" })).toHaveLength(1);
        expect(await repos.reservations.list({ date: "2026-06-25", roomId: "781" })).toHaveLength(
            1,
        );
    });
});

describe("ReservationsRepo — partial unique index correctness", () => {
    it("lets multiple cancelled rows for the same slot coexist", async () => {
        const a = await repos.reservations.create(baseBooking);
        await repos.reservations.cancel(a.id);
        const b = await repos.reservations.create(baseBooking); // slot freed by the cancel
        await repos.reservations.cancel(b.id);

        // Two rows now share (room, date, time) — allowed because the unique index only indexes
        // confirmed rows. This is the property that makes re-booking a cancelled slot possible.
        const sameSlot = (
            await repos.reservations.list({ roomId: baseBooking.roomId, date: baseBooking.date })
        ).filter(r => r.time === baseBooking.time);
        expect(sameSlot).toHaveLength(2);
        expect(sameSlot.every(r => r.status === "cancelled")).toBe(true);
    });

    it("supports repeated book → cancel → re-book cycles on one slot", async () => {
        for (let i = 0; i < 3; i++) {
            const created = await repos.reservations.create(baseBooking);
            expect(created.status).toBe("confirmed");
            await repos.reservations.cancel(created.id);
        }
        expect(await repos.reservations.list({ status: "confirmed" })).toHaveLength(0);
        expect(await repos.reservations.list({ status: "cancelled" })).toHaveLength(3);
    });

    it("constrains the EXACT start-slot only — it does NOT detect overlapping times", async () => {
        // Documenting intended behavior: the constraint is on the (room, date, time) start label,
        // not on time-range overlap. A 5:15 PM booking is independent of a 5:00 PM one.
        await repos.reservations.create(baseBooking);
        await expect(
            repos.reservations.create({ ...baseBooking, time: "5:15 PM" }),
        ).resolves.not.toThrow();
    });
});
