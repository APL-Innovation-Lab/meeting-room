import { Button, Card, CardGroup, Link } from "@trussworks/react-uswds";

import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Cancellation page • Meeting Room` }]);

export default function CancellationPageMeetingRoom() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[50rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <h3 className="font-sans text-sans-xs text-center pt-4">
                            Are you sure you want to cancel for the room below?
                        </h3>
                        <div className="flex-col pt-3 px-3">
                            <div className="flex-col pb-[20px]">
                                <h3 className="font-sans text-[22px] font-bold text-center">
                                    Carver Branch, #1
                                </h3>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                            </div>
                            <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                            <p className="font-sans text-sans-xs text-center">
                                9:00 AM to 9:15 AM
                            </p>
                            <p className="font-sans text-sans-xs text-center">Capacity: 4</p>
                            <div className="flex justify-center pt-7">
                                <Link href="cancellation-confirmation-page-meeting-room">
                                    <Button
                                        className="w-[206px] font-sans text-sans-xs bg-[#016E98] text-white pointer-events-none mr-0"
                                        type="button"
                                    >
                                        Yes, Cancel Request
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex justify-center pt-[18px] pb-[208px]">
                                <Link href="/">
                                    <Button
                                        className="usa-button--outline w-[232px] font-sans text-sans-xs bg-transparent text-[#026E98] border-[#026E98] pointer-events-none mr-0"
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
