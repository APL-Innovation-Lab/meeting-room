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
                        <h1 className="font-sans text-[40px] font-bold text-center m-0 pt-4">
                            Canceled
                        </h1>
                        <h3 className="font-sans text-sans-xs text-center pt-3">
                            The following has been canceled.
                        </h3>
                        <div className="flex-col pt-3 px-3">
                            <div className="flex-col pb-[20px]">
                                <h3 className="font-sans text-[22px] font-bold text-center">
                                    Central Library, Shared Learning - 408
                                </h3>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                            </div>
                            <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                            <p className="font-sans text-sans-xs text-center">
                                11:00 AM to 12:00 PM
                            </p>
                            <p className="font-sans text-sans-xs text-center">Capacity: 4</p>
                            <div className="flex justify-center pt-7 pb-[194px]">
                                <Link href="/">
                                    <Button
                                        className="w-[228px] font-sans text-sans-xs bg-[#016E98] text-white pointer-events-none mr-0"
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
