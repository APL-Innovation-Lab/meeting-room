import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { href } from "react-router";

import { Room } from "~/lib/room";
import { site } from "~/lib/site";

import type { Route } from "./+types/review";

export default function Component({ params }: Route.ComponentProps) {
    const roomKind = params.roomKind;
    const isMeetingRoom = Room.isMeeting(roomKind);

    return (
        <div className="flex justify-center">
            <title>{`Review Reservation • ${site.title}`}</title>
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <CardHeader className="-mt-3">
                            <h1 className="usa-card__heading text-center py-2 font-sans text-[40px] font-bold">
                                Review Request
                            </h1>
                            <p className="text-base-darker text-center font-sans text-sans-xs">
                                {isMeetingRoom
                                    ? "Review your meeting room request before submitting."
                                    : "Review your shared learning room reservation before submitting."}
                            </p>
                        </CardHeader>

                        <div className="my-6 flex justify-center">
                            <Link href={href("/:roomKind/confirm", { roomKind })}>
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
                                    Submit Request
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
