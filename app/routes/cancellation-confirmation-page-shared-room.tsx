import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";

import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Cancellation Confirmation page • Shared Room` }]);

// TODO: Eventually need to pass booking details data.
export default function CancellationConfirmationPageSharedRoom() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <h1 className="font-sans text-[40px] font-bold text-center">
                            Canceled
                        </h1>
                        <h3 className="font-sans text-sans-xs text-center">
                            The following has been canceled.
                        </h3>
                        <div className="flex-col px-3">
                            <div className="my-5">
                                <h3 className="font-sans text-[22px] font-bold text-center">
                                    Austin Central Library, Shared Learning #3
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
                                <br />
                                <div className="flex justify-center">
                                    <Link href="/">
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
                                            Back to Meeting Spaces
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
