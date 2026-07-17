import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";
import { href } from "react-router";

import { Room } from "~/lib/room";

import type { Route } from "./+types/cancel";

export default function Cancellation({ params }: Route.ComponentProps) {
    if (params.roomKind === Room.Meeting.kind) {
        return <MeetingRoomCancellation />;
    }

    return <SharedLearningRoomCancellation />;
}

function MeetingRoomCancellation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="max-w-[49rem] min-w-[50rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <h3 className="pt-4 text-center font-sans text-sans-xs">
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
                                        className="pointer-events-none mr-0 w-[206px] bg-[#016E98] font-sans text-sans-xs text-white"
                                        type="button"
                                    >
                                        Yes, Cancel Request
                                    </Button>
                                </Link>
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

function SharedLearningRoomCancellation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="max-w-[49rem] min-w-[50rem]">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <h3 className="pt-4 text-center font-sans text-sans-xs">
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
                                        className="pointer-events-none w-[206px] bg-[#016E98] font-sans text-sans-xs text-white"
                                        type="button"
                                    >
                                        Yes, Cancel Reservation
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex justify-center pt-[18px] pb-[208px]">
                                <Link href={href("/")}>
                                    <Button
                                        className="pointer-events-none w-[232px] border-[#026E98] bg-transparent font-sans text-sans-xs text-[#026E98] usa-button--outline"
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
