import { describe, expect, it } from "vitest";

import { createCancellationDetails, parseReservationId } from "./cancel.data.server";

const reservation = {
    id: 4,
    roomId: "615",
    roomKind: "shared-learning-room" as const,
    roomName: "Shared Learning - 615",
    branchName: "Central Library",
    branchAddress: "710 W Cesar Chavez St, Austin, TX 78701",
    capacity: 8,
    meetingTopic: "Team sync",
    fullName: "Alex Reader",
    emailAddress: "alex@example.com",
    date: "2026-07-19",
    time: "12:00 PM",
    durationMinutes: 120,
    status: "confirmed" as const,
};

describe("parseReservationId", () => {
    it("accepts a positive integer id", () => {
        expect(parseReservationId(new URL("http://x/slr/cancel?reservationId=4"))).toBe(4);
    });

    it.each(["", "?reservationId=", "?reservationId=abc", "?reservationId=-1", "?reservationId=0"])(
        "rejects %j",
        query => {
            expect(parseReservationId(new URL(`http://x/slr/cancel${query}`))).toBeUndefined();
        },
    );
});

describe("createCancellationDetails", () => {
    it("shapes the persisted reservation into display labels", () => {
        const details = createCancellationDetails(reservation);

        expect(details.id).toBe(4);
        expect(details.roomKind).toBe("shared-learning-room");
        expect(details.branchName).toBe("Central Library");
        expect(details.branchAddress).toBe("710 W Cesar Chavez St, Austin, TX 78701");
        expect(details.capacity).toBe(8);
        expect(details.dateLabel).toBe("Sun 7/19/2026");
        expect(details.timeLabel).toBe("12:00 PM - 2:00 PM");
    });

    it("carries the status the receipt page gates on", () => {
        expect(createCancellationDetails(reservation).status).toBe("confirmed");
        expect(createCancellationDetails({ ...reservation, status: "cancelled" }).status).toBe(
            "cancelled",
        );
    });
});
