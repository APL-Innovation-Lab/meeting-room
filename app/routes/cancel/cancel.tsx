import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";

import { Room } from "~/lib/room";
import type { Route } from "./+types/cancel";
import { href } from "react-router";

export default function Cancellation({ params }: Route.ComponentProps) {
    if (params.roomKind === Room.Meeting.kind) {
        return <MeetingRoomCancellation />;
    }

    return <SharedLearningRoomCancellation />;
}

function MeetingRoomCancellation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-120 max-w-196">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <h3 className="text-center pt-4 font-sans text-sans-xs">
                            Are you sure you want to cancel for the room below?
                        </h3>
                        <div className="flex-col px-3 pt-3">
                            <div className="flex-col pb-[20px]">
                                <h3 className="text-center font-sans text-[22px] font-bold">
                                    Carver Branch, Room #1
                                </h3>
                                <p className="text-center font-sans text-sans-xs">
                                    1161 Angelina St, Austin, TX 78702
                                </p>
                            </div>
                            <p className="text-center font-sans text-sans-xs">Mon 3/4/24</p>
                            <p className="text-center font-sans text-sans-xs">9:00 AM to 9:15 AM</p>
                            <p className="text-center font-sans text-sans-xs">Capacity: 100</p>
                            <div className="flex justify-center pt-7">
                                <Link
                                    href={href("/:roomKind/cancel/confirm", {
                                        roomKind: Room.Meeting.kind,
                                    })}
                                >
                                    <Button
                                        className="text-white pointer-events-none mr-0 w-[206px] bg-[#016E98] font-sans text-sans-xs"
                                        type="button"
                                    >
                                        Yes, Cancel Request
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex justify-center pb-[208px] pt-[18px]">
                                <Link href={href("/")}>
                                    <Button
                                        className="usa-button--outline bg-transparent pointer-events-none mr-0 w-[232px] border-[#026E98] font-sans text-sans-xs text-[#026E98]"
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

function SharedLearningRoomCancellation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-120 max-w-196">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <h3 className="text-center pt-4 font-sans text-sans-xs">
                            Are you sure you want to cancel your booking for the room below?
                        </h3>
                        <div className="flex-col px-3 pt-3">
                            <div className="flex-col pb-[20px]">
                                <h3 className="text-center font-sans text-[22px] font-bold">
                                    Central Library, Shared Learning - 408
                                </h3>
                                <p className="text-center font-sans text-sans-xs">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                            </div>
                            <p className="text-center font-sans text-sans-xs">Mon 3/4/24</p>
                            <p className="text-center font-sans text-sans-xs">
                                11:00 AM to 12:00 AM
                            </p>
                            <p className="text-center font-sans text-sans-xs">Capacity: 4</p>
                            <div className="flex justify-center pt-7">
                                <Link
                                    href={href("/:roomKind/cancel/confirm", {
                                        roomKind: Room.SharedLearning.kind,
                                    })}
                                >
                                    <Button
                                        className="text-white pointer-events-none w-[206px] bg-[#016E98] font-sans text-sans-xs"
                                        type="button"
                                    >
                                        Yes, Cancel Reservation
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex justify-center pb-[208px] pt-[18px]">
                                <Link href={href("/")}>
                                    <Button
                                        className="usa-button--outline bg-transparent pointer-events-none w-[232px] border-[#026E98] font-sans text-sans-xs text-[#026E98]"
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
