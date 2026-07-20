import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";
import { href, redirect } from "react-router";

import type { Route } from "./+types/confirm";

import { loadCancellationDetails, parseReservationId } from "./cancel.data.server";
import { ReservationFacts } from "./ReservationFacts";

export async function loader({ params, url }: Route.LoaderArgs) {
    const reservationId = parseReservationId(url);
    const details = reservationId ? await loadCancellationDetails(reservationId) : undefined;
    if (!details) throw redirect(href("/"));

    // A stale or hand-edited URL can pair a reservation with the wrong room kind; canonicalize so
    // the receipt always names what was actually cancelled.
    if (details.roomKind !== params.roomKind) {
        const canonical = href("/:roomKind/cancel/confirm", { roomKind: details.roomKind });
        throw redirect(`${canonical}?reservationId=${details.id}`);
    }

    // Never claim a cancellation that didn't happen — send back to the "are you sure" prompt.
    if (details.status !== "cancelled") {
        const prompt = href("/:roomKind/cancel", { roomKind: details.roomKind });
        throw redirect(`${prompt}?reservationId=${details.id}`);
    }

    return { details };
}

export default function CancellationConfirmation({ loaderData }: Route.ComponentProps) {
    const { details } = loaderData;

    return (
        <div className="flex justify-center">
            <CardGroup className="max-w-[49rem] min-w-[50rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <h1 className="m-0 pt-4 text-center font-sans text-[40px] font-bold">
                            Canceled
                        </h1>
                        <h3 className="pt-3 text-center font-sans text-sans-xs">
                            The following has been canceled.
                        </h3>
                        <div className="flex-col px-3 pt-3">
                            <ReservationFacts details={details} />
                            <div className="flex justify-center pt-7 pb-[194px]">
                                <Link href={href("/")}>
                                    <Button
                                        className="pointer-events-none mr-0 w-[228px] bg-[#016E98] font-sans text-sans-xs text-white"
                                        type="button"
                                    >
                                        Back to Meeting Spaces
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
