import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";
import { Form, href, redirect } from "react-router";

import type { Room } from "~/lib/room";

import { apl } from "~/lib/apl-client/apl-live-client.server";
import { CancellationFailedError, ReservationNotFoundError } from "~/lib/apl-client/errors";

import type { Route } from "./+types/cancel";

import { loadCancellationDetails, parseReservationId } from "./cancel.data.server";
import { ReservationFacts } from "./ReservationFacts";

export async function loader({ params, url }: Route.LoaderArgs) {
    const reservationId = parseReservationId(url);
    const details = reservationId ? await loadCancellationDetails(reservationId) : undefined;
    if (!details) throw redirect(href("/"));

    // A stale or hand-edited URL can pair a reservation with the wrong room kind; canonicalize so
    // the prompt always names what was actually booked.
    if (details.roomKind !== params.roomKind) {
        const canonical = href("/:roomKind/cancel", { roomKind: details.roomKind });
        throw redirect(`${canonical}?reservationId=${details.id}`);
    }

    // Nothing left to cancel — show the receipt instead of re-asking.
    if (details.status === "cancelled") {
        const receipt = href("/:roomKind/cancel/confirm", { roomKind: details.roomKind });
        throw redirect(`${receipt}?reservationId=${details.id}`);
    }

    return { details };
}

export async function action({ params, request }: Route.ActionArgs) {
    const formData = await request.formData();
    const submitted = formData.get("reservationId");
    const reservationId = typeof submitted === "string" ? Number.parseInt(submitted, 10) : NaN;
    if (!Number.isInteger(reservationId) || reservationId <= 0) throw redirect(href("/"));

    const result = await apl.cancelReservation(reservationId);
    if (result.error instanceof ReservationNotFoundError) throw redirect(href("/"));
    // Already cancelled is the state the user asked for — fall through to the receipt.
    if (result.error && !(result.error instanceof CancellationFailedError)) throw result.error;

    return redirect(
        `${href("/:roomKind/cancel/confirm", { roomKind: params.roomKind })}?reservationId=${reservationId}`,
    );
}

const COPY = {
    "meeting-room": {
        prompt: "Are you sure you want to cancel for the room below?",
        confirmLabel: "Yes, Cancel Request",
    },
    "shared-learning-room": {
        prompt: "Are you sure you want to cancel your booking for the room below?",
        confirmLabel: "Yes, Cancel Reservation",
    },
} satisfies Record<Room.Kind, { prompt: string; confirmLabel: string }>;

export default function Cancellation({ loaderData }: Route.ComponentProps) {
    const { details } = loaderData;
    const copy = COPY[details.roomKind];

    return (
        <div className="flex justify-center">
            <CardGroup className="max-w-[49rem] min-w-[50rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <h3 className="pt-4 text-center font-sans text-sans-xs">{copy.prompt}</h3>
                        <div className="flex-col px-3 pt-3">
                            <ReservationFacts details={details} />
                            <div className="flex justify-center pt-7">
                                <Form method="post">
                                    <input name="reservationId" type="hidden" value={details.id} />
                                    <Button
                                        className="mr-0 w-[206px] bg-[#016E98] font-sans text-sans-xs text-white"
                                        type="submit"
                                    >
                                        {copy.confirmLabel}
                                    </Button>
                                </Form>
                            </div>
                            <div className="flex justify-center pt-[18px] pb-[208px]">
                                <Link href={href("/")}>
                                    <Button
                                        className="pointer-events-none mr-0 w-[232px] border-[#026E98] bg-transparent font-sans text-sans-xs text-[#026E98] usa-button--outline"
                                        type="button"
                                    >
                                        No, Back to Meeting Spaces
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
