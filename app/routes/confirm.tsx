import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { getGoogleCalendarUrl, getICSDownloadUrl, getYahooCalendarUrl } from "~/utils/calendar";

import CalendarButton from "~/components/CalendarButton";
import { Room } from "~/lib/room";
import type { Route } from "./+types/confirm";
import TestEmailButton from "~/components/TestEmailButton";
import { href } from "react-router";
import { site } from "~/lib/site";

export default function Component({ params }: Route.ComponentProps) {
    if (params.roomKind === Room.Meeting.kind) {
        return <MeetingRoomConfirmation />;
    }

    return <SharedLearningRoomConfirmation />;
}

function SharedLearningRoomConfirmation() {
    // TODO: Move all of this to a server-side loader
    // dynamic url generation for absolute or relative paths; window vs email
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    // hard-coded data to be changed later with form submission data
    const title = "Austin Central Library, #3";
    const description = "Shared room reservation confirmation for Austin Central Library";
    const location = "710 W Cesar Chavez St, Austin, TX 78702";
    const start = new Date("2024-03-04T11:00:00-06:00");
    const end = new Date("2024-03-04T11:15:00-06:00");

    // calendar export links
    const googleLink = getGoogleCalendarUrl({ title, description, location, start, end });
    const yahooLink = getYahooCalendarUrl({ title, description, location, start, end });
    const icsLink = getICSDownloadUrl({ baseUrl, title, description, location, start, end });

    return (
        <div className="flex justify-center">
            <title>{`Confirmation • ${site.title}`}</title>
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <CardHeader className="-mt-3">
                            <h1 className="usa-card__heading text-center py-2 font-sans text-[40px] font-bold">
                                Submitted!
                            </h1>

                            <div
                                className="bg-gray-100 usa-dark-background"
                                style={{
                                    background: "#F0F0F0",
                                    padding: 10,
                                    textAlign: "center",
                                    textDecoration: "none",
                                }}
                            >
                                <h1 className="text-base-darker text-center font-sans text-sans-xs">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <ul className="ml-4 list-inside list-disc">
                                    <li>
                                        Beverages with lids are allowed. Please no food in the rooms
                                    </li>
                                    <li>
                                        If the reserving party is more than 15 minutes late, they
                                        forfeit the reservation
                                    </li>
                                </ul>
                            </div>
                        </CardHeader>
                        <br />
                        <p className="text-center font-sans text-sans-xs">
                            The following room has been reserved. A confirmation email has been
                            sent.
                        </p>

                        <div className="flex-col px-3">
                            <div className="my-5">
                                <p className="text-center font-sans text-sans-xs">
                                    <strong>Austin Central Library, #3</strong>
                                </p>
                                <p className="text-center font-sans text-sans-xs">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br />
                                <p className="text-center font-sans text-sans-xs">Mon 3/4/24</p>
                                <p className="text-center font-sans text-sans-xs">
                                    11:00 AM to 11:15 AM
                                </p>
                                <p className="text-center font-sans text-sans-xs">Capacity: 100</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={href("/")}>
                                        <Button
                                            className="font-sans text-sans-xs"
                                            style={{
                                                background: "#1E6F98",
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 41,
                                                paddingRight: 41,
                                                color: "#FFFFFFFF",
                                            }}
                                            type="button"
                                        >
                                            Back to Meeting Spaces
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <div className="mb-3 flex justify-center">
                                    <strong>Add to Calendar:</strong>
                                </div>
                                <div className="flex justify-center space-x-1">
                                    <Link href={googleLink} target="_blank" rel="noreferrer">
                                        <CalendarButton>Google</CalendarButton>
                                    </Link>
                                    <Link href={icsLink} download="reservation.ics">
                                        <CalendarButton>Outlook</CalendarButton>
                                    </Link>
                                    <Link href={icsLink} download="reservation.ics">
                                        <CalendarButton>iCal</CalendarButton>
                                    </Link>
                                    <Link href={yahooLink} target="_blank" rel="noreferrer">
                                        <CalendarButton>Yahoo!</CalendarButton>
                                    </Link>
                                </div>
                                <br />

                                <div className="flex justify-center">
                                    <Link
                                        href={href("/:roomKind/cancel", {
                                            roomKind: Room.SharedLearning.kind,
                                        })}
                                    >
                                        Cancel Reservation
                                    </Link>
                                </div>
                                <TestEmailButton
                                    template="sharedConfirmed"
                                    buttonTitle="Preview confirmation email"
                                    subject="APL Reservation: Confirmed Shared Learning - 408, Central Library"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

function MeetingRoomConfirmation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <CardHeader className="-mt-3">
                            <h1 className="usa-card__heading text-center py-2 font-sans text-[40px] font-bold">
                                Submitted!
                            </h1>
                            <p className="text-base-darker text-center font-sans text-sans-xs">
                                <strong className="font-bold">
                                    {" "}
                                    Status: Awaiting Confirmation
                                </strong>
                            </p>
                            <br />

                            <div
                                className="bg-gray-100 usa-dark-background"
                                style={{
                                    background: "#F0F0F0",
                                    padding: 10,
                                    textAlign: "center",
                                    textDecoration: "none",
                                    color: "#343434",
                                }}
                            >
                                <h1 className="text-base-darker text-center font-sans text-sans-xs">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <h6
                                    className="text-base-darker text-center font-sans text-sans-xs"
                                    style={{ color: "#343434" }}
                                >
                                    If you are booking less than three days in advance of your
                                    planned event, please contact the branch directly to assure your
                                    request is processed in time.
                                </h6>
                            </div>
                            <br />
                            <div>
                                <p className="text-center font-sans text-sans-xs">
                                    Thank you for requesting a Meeting Room. We will process your
                                    request within two business days. Please check your email for
                                    updates on the status of your request.
                                </p>
                            </div>
                        </CardHeader>

                        <div className="flex-col px-3">
                            <div className="my-4">
                                <p className="text-center font-sans text-sans-xs">
                                    <strong>Carver Branch #1</strong>
                                </p>
                                <p className="text-center font-sans text-sans-xs">
                                    1161 Angelina St, Austin, TX
                                </p>
                                <br />
                                <p className="text-center font-sans text-sans-xs">Mon 3/4/24</p>
                                <p className="text-center font-sans text-sans-xs">
                                    09:00 AM to 09:15 AM
                                </p>
                                <p className="text-center font-sans text-sans-xs">Capacity: 100</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={href("/")}>
                                        <Button
                                            className="font-sans text-sans-xs"
                                            style={{
                                                background: "#1E6F98",
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 41,
                                                paddingRight: 41,
                                                color: "#FFFFFFFF",
                                            }}
                                            type="button"
                                        >
                                            Back to Meeting Spaces
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <div className="flex justify-center">
                                    <Link
                                        href={href("/:roomKind/cancel", {
                                            roomKind: Room.Meeting.kind,
                                        })}
                                    >
                                        Cancel Request
                                    </Link>
                                </div>
                                <TestEmailButton
                                    template="meetingAwaiting"
                                    buttonTitle="Preview awaiting confirmation email"
                                    subject="APL Reservation: Awaiting Meeting Room #1, Carver Branch"
                                />
                                <TestEmailButton
                                    template="meetingConfirmed"
                                    buttonTitle="Preview confirmation email"
                                    subject="APL Reservation: Confirmed Meeting Room #1, Carver Branch"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
