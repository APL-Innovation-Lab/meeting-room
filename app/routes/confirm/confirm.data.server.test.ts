import { describe, expect, it } from "vitest";

import { austinDateTime, createReservationConfirmation } from "./confirm.data.server";

const sharedLearningReservation = {
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

describe("austinDateTime", () => {
    it("applies the daylight-saving offset for summer dates", () => {
        expect(austinDateTime("2026-07-19", 12 * 60).toISOString()).toBe(
            "2026-07-19T17:00:00.000Z",
        );
    });

    it("applies the standard offset for winter dates", () => {
        expect(austinDateTime("2026-01-19", 12 * 60).toISOString()).toBe(
            "2026-01-19T18:00:00.000Z",
        );
    });
});

describe("createReservationConfirmation", () => {
    it("shapes the persisted reservation into display labels", () => {
        const confirmation = createReservationConfirmation(
            sharedLearningReservation,
            "http://localhost:5173",
        );

        expect(confirmation.id).toBe(4);
        expect(confirmation.roomKind).toBe("shared-learning-room");
        expect(confirmation.branchName).toBe("Central Library");
        expect(confirmation.branchAddress).toBe("710 W Cesar Chavez St, Austin, TX 78701");
        expect(confirmation.capacity).toBe(8);
        expect(confirmation.dateLabel).toBe("Sun 7/19/2026");
        expect(confirmation.timeLabel).toBe("12:00 PM - 2:00 PM");
    });

    it("builds calendar links spanning the booked window for shared-learning rooms", () => {
        const confirmation = createReservationConfirmation(
            sharedLearningReservation,
            "http://localhost:5173",
        );

        expect(confirmation.calendarLinks).toBeDefined();
        const google = new URL(confirmation.calendarLinks!.google);
        expect(google.searchParams.get("text")).toBe("Central Library, Shared Learning - 615");
        expect(google.searchParams.get("dates")).toBe("20260719T170000Z/20260719T190000Z");

        const ics = new URL(confirmation.calendarLinks!.ics);
        expect(ics.origin).toBe("http://localhost:5173");
        expect(ics.pathname).toBe("/calendar.ics");
        expect(ics.searchParams.get("start")).toBe("2026-07-19T17:00:00.000Z");
        expect(ics.searchParams.get("end")).toBe("2026-07-19T19:00:00.000Z");
        expect(ics.searchParams.get("location")).toBe("710 W Cesar Chavez St, Austin, TX 78701");
    });

    it("omits calendar links for meeting-room requests awaiting staff confirmation", () => {
        const confirmation = createReservationConfirmation(
            {
                ...sharedLearningReservation,
                roomKind: "meeting-room",
                roomName: "Carver Branch #1",
                branchName: "Carver Branch",
                orgName: "Friends of the Library",
                orgPurpose: "Community outreach",
                phoneNumber: "512-974-7300",
            },
            "http://localhost:5173",
        );

        expect(confirmation.calendarLinks).toBeUndefined();
    });
});
