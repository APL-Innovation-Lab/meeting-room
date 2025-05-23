import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Cancellation page • Meeting Room` }]);

export default function CancellationPageMeetingRoom() {
    return (
        <div className="flex justify-center">
             <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3">

                        </CardHeader>
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
                                    <Link href="#">
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
                                    <Link href="#">
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
