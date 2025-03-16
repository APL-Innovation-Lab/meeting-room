import { useNavigate } from "@remix-run/react";
import { Button, Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Confirmation page • Meeting Room` }]);

export default function confirmationPageMeetingRoom() {
    const navigate = useNavigate();

    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>

                    <div className="justify-center ml-5 mr-5">

                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2 text-center">
                                Submitted!
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs text-center">
                                <strong className="font-bold"> Status: Awaiting Confirmation</strong>
                            </p>
                            <br/>
                            <div className="bg-gray-100">
                                <p className="font-sans text-base-darker text-sans-xs text-center">
                                    <strong className="font-bold"> Please Note</strong>
                                </p>
                                <p className="font-sans text-base-darker text-sans-xs text-center">
                                    If you are booking less than three days in
                                    advance of your planned event, please contact the branch directly to
                                    assure your request is processed in time.
                                </p>
                                <br/>

                                <p className="font-sans text-sans-xs text-center">
                                    Thank you for requesting a Meeting Room. We will process your request within two
                                    business days. Please check your email for updates on the status of your request.
                                </p>
                            </div>
                        </CardHeader>

                        <div className="flex-col px-3 ">

                            <div className="my-4">
                                
                            <p className="font-sans text-sans-xs text-center">
                                <strong>Carver Branch #1</strong> 
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    1161 Angelina St, Austin, TX
                                </p>
                                <br/>
                                <p className="font-sans text-sans-xs text-center">
                                    Mon 3/4/24
                                </p>
                                <p className="font-sans  text-sans-xs text-center">
                                    09:00 AM to 09:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    Capacity: 100
                                </p>
                                <br/>

                                <div className="flex justify-center">
                                    <Link href="#">
                                    <Button className="font-sans text-sans-xs " type='button'>
                                    Back to Meeting Spaces
                                    </Button>
                                    </Link>

                                </div>
                                <br/>

                                <div className="flex justify-center">
                                    <Link href="#">Cancel Request</Link>
                                </div>

                            </div>
                        </div>

                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
