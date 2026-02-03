import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import CalendarButton from "~/components/CalendarButton";
import { mergeMeta } from "~/lib/merge-meta";
import { RoomType, routes } from "~/route-map";
import { getGoogleCalendarUrl, getICSDownloadUrl, getYahooCalendarUrl } from "~/utils/calendar";
import type { Route } from "./+types/confirm";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Confirmation • ${parentTitle}` }]);

export default function Confirmation({ params }: Route.ComponentProps) {
    const roomType = params.roomType as RoomType;
    const isMeetingRoom = roomType === RoomType.MeetingRoom;

    if (isMeetingRoom) {
        return <MeetingRoomConfirmation roomType={roomType} />;
    }

    return <SharedRoomConfirmation roomType={roomType} />;
}

type ConfirmationProps = {
    roomType: RoomType;
};

function SharedRoomConfirmation({ roomType }: ConfirmationProps) {
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
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2 text-center">
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
                                <h1 className="font-sans text-base-darker text-sans-xs text-center">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <ul className="list-disc list-inside ml-4">
                                    <li>Beverages with lids are allowed. Please no food in the rooms</li>
                                    <li>
                                        If the reserving party is more than 15 minutes late, they
                                        forfeit the reservation
                                    </li>
                                </ul>
                            </div>
                        </CardHeader>
                        <br />
                        <p className="font-sans text-sans-xs text-center">
                            The following room has been reserved. A confirmation email has been
                            sent.
                        </p>

                        <div className="flex-col px-3">
                            <div className="my-5">
                                <p className="font-sans text-sans-xs text-center">
                                    <strong>Austin Central Library, #3</strong>
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br />
                                <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                                <p className="font-sans text-sans-xs text-center">
                                    11:00 AM to 11:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">Capacity: 100</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={routes.home.href()}>
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
                                <div className="flex justify-center mb-3">
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
                                    <Link href={routes.cancel.href({ roomType })}>Cancel Reservation</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

function MeetingRoomConfirmation({ roomType }: ConfirmationProps) {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2 text-center">
                                Submitted!
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs text-center">
                                <strong className="font-bold"> Status: Awaiting Confirmation</strong>
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
                                <h1 className="font-sans text-base-darker text-sans-xs text-center">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <h6
                                    className="font-sans text-base-darker text-sans-xs text-center"
                                    style={{ color: "#343434" }}
                                >
                                    If you are booking less than three days in advance of your
                                    planned event, please contact the branch directly to assure your
                                    request is processed in time.
                                </h6>
                            </div>
                            <br />
                            <div>
                                <p className="font-sans text-sans-xs text-center">
                                    Thank you for requesting a Meeting Room. We will process your
                                    request within two business days. Please check your email for
                                    updates on the status of your request.
                                </p>
                            </div>
                        </CardHeader>

                        <div className="flex-col px-3 ">
                            <div className="my-4">
                                <p className="font-sans text-sans-xs text-center">
                                    <strong>Carver Branch #1</strong>
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    1161 Angelina St, Austin, TX
                                </p>
                                <br />
                                <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                                <p className="font-sans  text-sans-xs text-center">
                                    09:00 AM to 09:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">Capacity: 100</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={routes.home.href()}>
                                        <Button
                                            className="font-sans text-sans-xs "
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
                                    <Link href={routes.cancel.href({ roomType })}>Cancel Request</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
