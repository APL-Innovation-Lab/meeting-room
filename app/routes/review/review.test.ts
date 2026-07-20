import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoomAlreadyReservedError } from "~/lib/apl-client/errors";

const aplMocks = vi.hoisted(() => ({
    createReservation: vi.fn(),
    getBranchDirectory: vi.fn(),
    getMeetingRooms: vi.fn(),
    getRooms: vi.fn(),
}));

vi.mock("~/lib/apl-client/apl-live-client.server", async importOriginal => ({
    ...(await importOriginal<typeof import("~/lib/apl-client/apl-live-client.server")>()),
    apl: aplMocks,
}));

import { action, loader } from "./review";

const sharedLearningRoom = {
    branch: {
        name: "Central Library",
        floor: 4,
        address: "710 W Cesar Chavez St, Austin, TX 78701",
        image: "/library/slr-408.jpg",
    },
    info: {
        id: "408",
        name: "Shared Learning - 408",
        type: "shared-learning-room" as const,
        capacity: 8,
        amenities: { airplay: true, hdmi: true, whiteboard: false },
        availableTimes: ["11:00 AM", "11:15 AM"],
        availableDurations: [60, 120],
        date: "2026-07-24",
    },
};

const meetingRoom = {
    branch: {
        name: "Old Quarry Branch",
        address: "7051 Village Center Dr, Austin, TX 78731",
        image: "/library/oqmeeting.jpg",
    },
    info: {
        id: "782",
        name: "Old Quarry Meeting Room",
        type: "meeting-room" as const,
        capacity: 60,
        amenities: {},
        availableTimes: ["5:00 PM"],
        availableDurations: [120],
        date: "2026-07-24",
    },
};

const REVIEW_URL =
    "http://localhost/shared-learning-room/review?roomId=408&location=Central+Library&date=2026-07-24&time=11%3A00+AM&duration=60";

function loaderArgs(roomKind: string, url: string) {
    return { params: { roomKind }, url: new URL(url) } as never;
}

async function expectRedirect(promise: Promise<unknown>): Promise<string> {
    try {
        await promise;
    } catch (thrown) {
        expect(thrown).toBeInstanceOf(Response);
        return (thrown as Response).headers.get("Location") ?? "";
    }
    return expect.fail("expected the loader to redirect");
}

beforeEach(() => {
    vi.clearAllMocks();
    aplMocks.getRooms.mockResolvedValue({ data: [sharedLearningRoom], error: undefined });
    aplMocks.getMeetingRooms.mockResolvedValue({ data: [meetingRoom], error: undefined });
    aplMocks.getBranchDirectory.mockResolvedValue({ data: [], error: undefined });
});

describe("review route loader", () => {
    it("redirects back to search when the selection params are missing", async () => {
        const location = await expectRedirect(
            loader(
                loaderArgs(
                    "shared-learning-room",
                    "http://localhost/shared-learning-room/review?date=2026-07-24&duration=60",
                ),
            ),
        );
        expect(location).toBe("/shared-learning-room?date=2026-07-24&duration=60");
        expect(aplMocks.getRooms).not.toHaveBeenCalled();
    });

    it("resolves a null summary when the room no longer exists", async () => {
        aplMocks.getRooms.mockResolvedValue({ data: [], error: undefined });
        const loaderData = await loader(loaderArgs("shared-learning-room", REVIEW_URL));

        await expect(loaderData.deferredSummary).resolves.toBeNull();
        expect(loaderData.searchUrl).toBe(
            "/shared-learning-room?location=Central+Library&date=2026-07-24&duration=60",
        );
    });

    it("resolves a null summary when the requested time is no longer open", async () => {
        const loaderData = await loader(
            loaderArgs(
                "shared-learning-room",
                REVIEW_URL.replace("time=11%3A00+AM", "time=9%3A00+AM"),
            ),
        );

        await expect(loaderData.deferredSummary).resolves.toBeNull();
    });

    it("returns the selection, header labels, and a display-ready room summary", async () => {
        const loaderData = await loader(loaderArgs("shared-learning-room", REVIEW_URL));

        expect(loaderData.selection).toEqual({
            roomId: "408",
            location: "Central Library",
            date: "2026-07-24",
            time: "11:00 AM",
            duration: 60,
        });
        expect(loaderData.dateLabel).toBe("Fri 7/24/2026");
        expect(loaderData.timeLabel).toBe("11:00 AM - 12:00 PM");
        await expect(loaderData.deferredSummary).resolves.toEqual({
            roomId: "408",
            name: "Shared Learning - 408",
            kindLabel: "Shared Learning Room",
            branch: "Central Library",
            address: "710 W Cesar Chavez St, Austin, TX 78701",
            floor: 4,
            capacity: 8,
            amenities: [
                { label: "AirPlay", icon: "/img/material-icons/airplay.svg" },
                { label: "HDMI", icon: "/img/material-icons/settings_input_hdmi.svg" },
            ],
            image: "https://library.austintexas.gov/library/slr-408.jpg",
        });

        // The location carried over from search narrows the per-branch reservation fetches.
        const [options] = aplMocks.getRooms.mock.calls[0];
        expect(options.location).toBe("Central Library");
        expect(options.duration).toBe(60);
        expect(options.date.toISOString().slice(0, 10)).toBe("2026-07-24");
    });

    it("leaves the room fetch unfiltered when no location carried over", async () => {
        await loader(
            loaderArgs(
                "meeting-room",
                "http://localhost/meeting-room/review?roomId=782&date=2026-07-24&time=5%3A00+PM&duration=120",
            ),
        );

        expect(aplMocks.getRooms).not.toHaveBeenCalled();
        const [options] = aplMocks.getMeetingRooms.mock.calls[0];
        expect(options.location).toBeUndefined();
    });

    it("resolves meeting rooms through the meeting-room client", async () => {
        const loaderData = await loader(
            loaderArgs(
                "meeting-room",
                "http://localhost/meeting-room/review?roomId=782&date=2026-07-24&time=5%3A00+PM&duration=120",
            ),
        );

        const summary = await loaderData.deferredSummary;
        expect(summary?.kindLabel).toBe("Meeting Room");
        expect(loaderData.timeLabel).toBe("5:00 PM - 7:00 PM");
    });

    it("fills address and image from the branch directory when the room has neither", async () => {
        aplMocks.getMeetingRooms.mockResolvedValue({
            data: [
                {
                    ...meetingRoom,
                    branch: { name: "Cepeda Branch", address: "", image: "" },
                    info: { ...meetingRoom.info, id: "783", name: "Cepeda Branch #1" },
                },
            ],
            error: undefined,
        });
        aplMocks.getBranchDirectory.mockResolvedValue({
            data: [
                {
                    branch: "Cepeda Branch",
                    address: "651 N. Pleasant Valley Rd.",
                    image: "/library/acp%5B1%5D_0.jpg",
                    path: "/cepeda",
                },
            ],
            error: undefined,
        });

        const loaderData = await loader(
            loaderArgs(
                "meeting-room",
                "http://localhost/meeting-room/review?roomId=783&location=Cepeda+Branch&date=2026-07-24&time=5%3A00+PM&duration=120",
            ),
        );

        const summary = await loaderData.deferredSummary;
        expect(summary?.address).toBe("651 N. Pleasant Valley Rd.");
        expect(summary?.image).toBe("https://library.austintexas.gov/library/acp%5B1%5D_0.jpg");
        // The carried-over location narrows the meeting-room lookup.
        const [options] = aplMocks.getMeetingRooms.mock.calls[0];
        expect(options.location).toBe("Cepeda Branch");
    });
});

type ActionErrors = { data: { errors: Record<string, string> }; init: { status: number } };

function actionArgs(roomKind: string, fields: Record<string, string>) {
    const body = new FormData();
    for (const [name, value] of Object.entries(fields)) body.set(name, value);
    const request = new Request(`http://localhost/${roomKind}/review`, { method: "POST", body });
    return { params: { roomKind }, request } as never;
}

const validSharedLearningFields = {
    roomId: "408",
    date: "2026-07-24",
    time: "11:00 AM",
    meetingTopic: "Team sync",
    fullName: "Alex Reader",
    emailAddress: "alex@example.com",
    agree: "on",
};

const validMeetingFields = {
    roomId: "782",
    date: "2026-07-24",
    time: "5:00 PM",
    meetingTopic: "Neighborhood meetup",
    fullName: "Alex Reader",
    emailAddress: "alex@example.com",
    orgName: "Friends of the Library",
    orgPurpose: "Community outreach",
    phoneNumber: "512-974-7300",
    agree: "on",
};

describe("review route action", () => {
    it("rejects blank required fields without touching the reservation client", async () => {
        const result = (await action(
            actionArgs("shared-learning-room", {
                ...validSharedLearningFields,
                meetingTopic: "   ",
                fullName: "",
            }),
        )) as ActionErrors;

        expect(result.init.status).toBe(400);
        expect(result.data.errors.meetingTopic).toBeTruthy();
        expect(result.data.errors.fullName).toBeTruthy();
        expect(aplMocks.createReservation).not.toHaveBeenCalled();
    });

    it("rejects an invalid email address", async () => {
        const result = (await action(
            actionArgs("shared-learning-room", {
                ...validSharedLearningFields,
                emailAddress: "not-an-email",
            }),
        )) as ActionErrors;

        expect(result.init.status).toBe(400);
        expect(result.data.errors.emailAddress).toBe("Enter a valid email address");
    });

    it("rejects an invalid phone number for meeting rooms", async () => {
        const result = (await action(
            actionArgs("meeting-room", { ...validMeetingFields, phoneNumber: "not a phone" }),
        )) as ActionErrors;

        expect(result.init.status).toBe(400);
        expect(result.data.errors.phoneNumber).toBe("Enter a valid phone number");
    });

    it("rejects submissions without the policy agreement", async () => {
        const result = (await action(
            actionArgs("shared-learning-room", { ...validSharedLearningFields, agree: "" }),
        )) as ActionErrors;

        expect(result.init.status).toBe(400);
        expect(result.data.errors.agree).toBeTruthy();
        expect(aplMocks.createReservation).not.toHaveBeenCalled();
    });

    it("surfaces a tampered room selection as a form-level error", async () => {
        const result = (await action(
            actionArgs("shared-learning-room", { ...validSharedLearningFields, roomId: "" }),
        )) as ActionErrors;

        expect(result.init.status).toBe(400);
        expect(result.data.errors.form).toContain("selection is incomplete");
    });

    it("books the room and redirects to the confirmation page", async () => {
        aplMocks.createReservation.mockResolvedValue({ data: { id: 7 }, error: undefined });

        const response = (await action(
            actionArgs("shared-learning-room", validSharedLearningFields),
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe(
            "/shared-learning-room/confirm?reservationId=7",
        );
        expect(aplMocks.createReservation).toHaveBeenCalledWith({
            roomKind: "shared-learning-room",
            roomId: "408",
            date: "2026-07-24",
            time: "11:00 AM",
            meetingTopic: "Team sync",
            fullName: "Alex Reader",
            emailAddress: "alex@example.com",
        });
    });

    it("passes the meeting-room-only fields through to the reservation client", async () => {
        aplMocks.createReservation.mockResolvedValue({ data: { id: 8 }, error: undefined });

        await action(actionArgs("meeting-room", { ...validMeetingFields, website: "" }));

        expect(aplMocks.createReservation).toHaveBeenCalledWith({
            roomKind: "meeting-room",
            roomId: "782",
            date: "2026-07-24",
            time: "5:00 PM",
            meetingTopic: "Neighborhood meetup",
            fullName: "Alex Reader",
            emailAddress: "alex@example.com",
            orgName: "Friends of the Library",
            orgPurpose: "Community outreach",
            phoneNumber: "512-974-7300",
            website: undefined,
        });
    });

    it("reports a slot conflict as a form-level error", async () => {
        aplMocks.createReservation.mockResolvedValue({
            data: undefined,
            error: new RoomAlreadyReservedError(),
        });

        const result = (await action(
            actionArgs("shared-learning-room", validSharedLearningFields),
        )) as ActionErrors;

        expect(result.init.status).toBe(409);
        expect(result.data.errors.form).toContain("just booked");
    });
});
