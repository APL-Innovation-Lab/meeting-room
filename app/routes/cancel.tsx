import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { site } from "~/lib/site";
import { RoomType, routes } from "~/route-map";
import type { Route } from "./+types/cancel";

export default function Cancellation({ params }: Route.ComponentProps) {
    if (params.roomType === RoomType.MeetingRoom) {
        return <MeetingRoomCancellation />;
    }

    return <SharedLearningRoomCancellation />;
}

function MeetingRoomCancellation() {
    return (
        <div className="flex justify-center">
            <title>{`Cancellation • ${site.title}`}</title>
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3"></CardHeader>
                        <br />
                        <br />
                        <h3 className="font-sans text-sans-xs text-center">
                            Are you sure you want to cancel for the room below?
                        </h3>

                        <div className="flex-col px-3">
                            <div className="my-5">
                                <h3 className="font-sans text-[22px] font-bold text-center">
                                    Carver Branch, #1
                                </h3>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br />
                                <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                                <p className="font-sans text-sans-xs text-center">
                                    9:00 AM to 9:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">Capacity: 4</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={routes.home.href()}>
                                        <Button
                                            className="font-sans text-sans-xs"
                                            style={{
                                                background: "#1E6F98",
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 15,
                                                paddingRight: 15,
                                                color: "#FFFFFFFF",
                                            }}
                                            type="button"
                                        >
                                            Yes, Cancel Request
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <div className="flex justify-center">
                                    <Link
                                        href={routes.confirm.href({
                                            roomType: RoomType.MeetingRoom,
                                        })}
                                    >
                                        <Button
                                            className="font-sans text-sans-xs usa-button usa-button--outline"
                                            style={{
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 35,
                                                paddingRight: 35,
                                            }}
                                            type="button"
                                        >
                                            No, Back to Meeting Spaces
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <br />
                                <br />
                                <br />
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
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <br />
                    <br />
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3"></CardHeader>

                        <br />
                        <h3 className="font-sans text-sans-xs text-center">
                            Are you sure you want to cancel your booking for the room below?
                        </h3>

                        <div className="flex-col px-3">
                            <div className="my-5">
                                <h3 className="font-sans text-[22px] font-bold text-center">
                                    Austin Central Library, #3
                                </h3>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br />
                                <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                                <p className="font-sans text-sans-xs text-center">
                                    9:00 AM to 9:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">Capacity: 4</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href={routes.home.href()}>
                                        <Button
                                            className="font-sans text-sans-xs"
                                            style={{
                                                background: "#1E6F98",
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 15,
                                                paddingRight: 15,
                                                color: "#FFFFFFFF",
                                            }}
                                            type="button"
                                        >
                                            Yes, Cancel Reservation
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <div className="flex justify-center">
                                    <Link
                                        href={routes.confirm.href({
                                            roomType: RoomType.SharedLearningRoom,
                                        })}
                                    >
                                        <Button
                                            className="font-sans text-sans-xs usa-button usa-button--outline"
                                            style={{
                                                paddingTop: 15,
                                                paddingBottom: 15,
                                                paddingLeft: 35,
                                                paddingRight: 35,
                                            }}
                                            type="button"
                                        >
                                            No, Back to Meeting Spaces
                                        </Button>
                                    </Link>
                                </div>
                                <br />
                                <br />
                                <br />
                                <br />
                                <br />
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
