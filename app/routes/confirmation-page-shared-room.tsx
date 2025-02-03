import { useNavigate } from "@remix-run/react";
import { Button, Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Confirmation page • Shared Room ${parentTitle}` }]);


export default function confirmationPageSharedRoom() {
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
                            {/* <p className="font-sans text-base-darker text-sans-xs text-center">
                                <strong className="font-bold text-center"> Status: Awaiting Confirmation</strong>
                            </p> */}

                            <div className="my-4">

                                <p className="font-sans text-base-darker text-sans-xs text-center">
                                <strong className="font-bold text-center"> Please Note</strong>
                            </p>
                                <ul className="list-disc ml-4">
                                    <li>
                                        Beverages with lids are allowed. Please no food in the rooms
                                    </li>
                                    <li>
                                        If the reserving party is more than 15 minutes late, they forfeit the reservation
                                    </li>
                                </ul>
                            </div>
                            <p className="font-sans text-sans-xs text-center">
                                The following room has been reserved. A confirmation email has been.
                            </p>
                        </CardHeader>

                        <div className="flex-col px-3">

                            <div className="my-5">
                                
                                <p className="font-sans text-sans-xs text-center">
                                <strong>Austin Central Library, #3</strong> 
                                    
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br/>
                                <p className="font-sans text-sans-xs text-center">
                                    Mon 3/4/24
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    11:00 AM to 11:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    Capacity: 100
                                </p>
                                <br/>

                                <div className="flex justify-center">
                                <Link href="#">
                                    <Button className="font-sans text-sans-xs">
                                    Back to meeting Spaces
                                    </Button>
                                    </Link>
                                </div>
                                <br/>
                                <div className="flex justify-center">
                                <Link href="#">
                                    <Button className="font-sans text-sans-xs">
                                    Add to Calendar
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
