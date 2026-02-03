import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { site } from "~/lib/site";
import { RoomType, routes } from "~/route-map";
import type { Route } from "./+types/review";

export default function Component({ params }: Route.ComponentProps) {
    const roomType = params.roomType as RoomType;
    const isMeetingRoom = roomType === RoomType.MeetingRoom;

    return (
        <div className="flex justify-center">
            <title>{`Review Reservation • ${site.title}`}</title>
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2 text-center">
                                Review Request
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs text-center">
                                {isMeetingRoom
                                    ? "Review your meeting room request before submitting."
                                    : "Review your shared learning room reservation before submitting."}
                            </p>
                        </CardHeader>

                        <div className="flex justify-center my-6">
                            <Link href={routes.confirm.href({ roomType })}>
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
