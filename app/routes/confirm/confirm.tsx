import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { href, redirect } from "react-router";

import CalendarButton from "~/components/CalendarButton";
import { Room } from "~/lib/room";
import { site } from "~/lib/site";

import type { Route } from "./+types/confirm";

import {
    loadReservationConfirmation,
    type CalendarLinks,
    type ReservationConfirmation,
} from "./confirm.data.server";

export function loader({ params, url }: Route.LoaderArgs) {
    const reservationId = Number.parseInt(url.searchParams.get("reservationId") ?? "", 10);
    const confirmation =
        Number.isInteger(reservationId) && reservationId > 0
            ? loadReservationConfirmation(reservationId, url.origin)
            : undefined;
    if (!confirmation) throw redirect(href("/"));

    // A stale or hand-edited URL can pair a reservation with the wrong room kind; canonicalize so
    // the page always reflects what was actually booked.
    if (confirmation.roomKind !== params.roomKind) {
        const canonical = href("/:roomKind/confirm", { roomKind: confirmation.roomKind });
        throw redirect(`${canonical}?reservationId=${confirmation.id}`);
    }

    return { confirmation };
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const { confirmation } = loaderData;
    if (confirmation.roomKind === Room.Meeting.kind) {
        return <MeetingRoomConfirmation confirmation={confirmation} />;
    }
    return <SharedLearningRoomConfirmation confirmation={confirmation} />;
}

function SharedLearningRoomConfirmation({
    confirmation,
}: {
    confirmation: ReservationConfirmation;
}) {
    return (
        <div className="flex justify-center">
            <title>{`Confirmation • ${site.title}`}</title>
            <CardGroup className="max-w-[49rem] min-w-[30rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <CardHeader className="-mt-3">
                            <h1 className="py-2 text-center font-sans text-[40px] font-bold usa-card__heading">
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
                                <h1 className="text-center font-sans text-sans-xs text-base-darker">
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
                                <ReservationFacts confirmation={confirmation} />
                                <br />

                                <BackToMeetingSpaces />
                                <br />
                                {confirmation.calendarLinks && (
                                    <AddToCalendar links={confirmation.calendarLinks} />
                                )}
                                <br />

                                <div className="flex justify-center">
                                    <Link href={cancelPageUrl(confirmation)}>
                                        Cancel Reservation
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

function MeetingRoomConfirmation({ confirmation }: { confirmation: ReservationConfirmation }) {
    return (
        <div className="flex justify-center">
            <title>{`Confirmation • ${site.title}`}</title>
            <CardGroup className="max-w-[49rem] min-w-[30rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <CardHeader className="-mt-3">
                            <h1 className="py-2 text-center font-sans text-[40px] font-bold usa-card__heading">
                                Submitted!
                            </h1>
                            <p className="text-center font-sans text-sans-xs text-base-darker">
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
                                <h1 className="text-center font-sans text-sans-xs text-base-darker">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <h6
                                    className="text-center font-sans text-sans-xs text-base-darker"
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
                                <ReservationFacts confirmation={confirmation} />
                                <br />

                                <BackToMeetingSpaces />
                                <br />

                                <div className="flex justify-center">
                                    <Link href={cancelPageUrl(confirmation)}>Cancel Request</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

/** The booked room, exactly as it was persisted at reservation time. */
function ReservationFacts({ confirmation }: { confirmation: ReservationConfirmation }) {
    return (
        <>
            <p className="text-center font-sans text-sans-xs">
                <strong>
                    {confirmation.branchName}, {confirmation.roomName}
                </strong>
            </p>
            {confirmation.branchAddress && (
                <p className="text-center font-sans text-sans-xs">{confirmation.branchAddress}</p>
            )}
            <br />
            <p className="text-center font-sans text-sans-xs">{confirmation.dateLabel}</p>
            <p className="text-center font-sans text-sans-xs">{confirmation.timeLabel}</p>
            {confirmation.capacity > 0 && (
                <p className="text-center font-sans text-sans-xs">
                    Capacity: {confirmation.capacity}
                </p>
            )}
        </>
    );
}

function BackToMeetingSpaces() {
    return (
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
    );
}

function AddToCalendar({ links }: { links: CalendarLinks }) {
    return (
        <>
            <div className="mb-3 flex justify-center">
                <strong>Add to Calendar:</strong>
            </div>
            <div className="flex justify-center space-x-1">
                <Link href={links.google} target="_blank" rel="noreferrer">
                    <CalendarButton>Google</CalendarButton>
                </Link>
                <Link href={links.ics} download="reservation.ics">
                    <CalendarButton>Outlook</CalendarButton>
                </Link>
                <Link href={links.ics} download="reservation.ics">
                    <CalendarButton>iCal</CalendarButton>
                </Link>
                <Link href={links.yahoo} target="_blank" rel="noreferrer">
                    <CalendarButton>Yahoo!</CalendarButton>
                </Link>
            </div>
        </>
    );
}

/** The cancel page for this reservation; carries the id so the cancel flow can act on it. */
function cancelPageUrl(confirmation: ReservationConfirmation): string {
    return `${href("/:roomKind/cancel", { roomKind: confirmation.roomKind })}?reservationId=${confirmation.id}`;
}
