import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";
import { href } from "react-router";

import { Room } from "~/lib/room";

import type { Route } from "./+types/confirm";

export default function CancellationConfirmation({ params }: Route.ComponentProps) {
    if (params.roomKind === Room.Meeting.kind) {
        return <MeetingRoomCancellationConfirmation />;
    }

    return <SharedLearningRoomCancellationConfirmation />;
}

function MeetingRoomCancellationConfirmation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <h1 className="text-center m-0 pt-4 font-sans text-[40px] font-bold">
                            Canceled
                        </h1>
                        <h3 className="text-center pt-3 font-sans text-sans-xs">
                            The following has been canceled.
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
                            <div className="flex justify-center pb-[194px] pt-7">
                                <Link href={href("/")}>
                                    <Button
                                        className="text-white pointer-events-none mr-0 w-[228px] bg-[#016E98] font-sans text-sans-xs"
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

function SharedLearningRoomCancellationConfirmation() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <div className="ml-5 mr-5 justify-center">
                        <h1 className="text-center m-0 pt-4 font-sans text-[40px] font-bold">
                            Canceled
                        </h1>
                        <h3 className="text-center pt-3 font-sans text-sans-xs">
                            The following has been canceled.
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
                                11:00 AM to 12:00 PM
                            </p>
                            <p className="text-center font-sans text-sans-xs">Capacity: 4</p>
                            <div className="flex justify-center pb-[194px] pt-7">
                                <Link href={href("/")}>
                                    <Button
                                        className="text-white pointer-events-none mr-0 w-[228px] bg-[#016E98] font-sans text-sans-xs"
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
