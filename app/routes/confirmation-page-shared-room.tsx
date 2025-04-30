import { Button, Card, CardGroup, CardHeader, Link } from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Confirmation page • Shared Room` }]);

export default function ConfirmationPageSharedRoom() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="justify-center ml-5 mr-5">
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2 text-center">
                                Submitted!
                            </h1>

                            <div
                                className="bg-gray-100 usa-dark-background"
                                style={{
                                    background: "#F0F0F0",
                                    padding: 10,
                                    textAlign: "center",
                                    textDecoration: "none",
                                }}
                            >
                                <h1 className="font-sans text-base-darker text-sans-xs text-center">
                                    <strong
                                        className="text-bold text-center"
                                        style={{ color: "#000000FF" }}
                                    >
                                        {" "}
                                        Please Note
                                    </strong>
                                </h1>
                                <ul className="list-disc list-inside ml-4">
                                    <li>
                                        Beverages with lids are allowed. Please no food in the rooms
                                    </li>
                                    <li>
                                        If the reserving party is more than 15 minutes late, they
                                        forfeit the reservation
                                    </li>
                                </ul>
                            </div>
                        </CardHeader>
                        <br />
                        <p className="font-sans text-sans-xs text-center">
                            The following room has been reserved. A confirmation email has been
                            sent.
                        </p>

                        <div className="flex-col px-3">
                            <div className="my-5">
                                <p className="font-sans text-sans-xs text-center">
                                    <strong>Austin Central Library, #3</strong>
                                </p>
                                <p className="font-sans text-sans-xs text-center">
                                    710 W Cesar Chavez St, Austin, TX 78702
                                </p>
                                <br />
                                <p className="font-sans text-sans-xs text-center">Mon 3/4/24</p>
                                <p className="font-sans text-sans-xs text-center">
                                    11:00 AM to 11:15 AM
                                </p>
                                <p className="font-sans text-sans-xs text-center">Capacity: 100</p>
                                <br />

                                <div className="flex justify-center">
                                    <Link href="#">
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
                                            Back to Meeting Spaces
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
                                                paddingLeft: 68,
                                                paddingRight: 68,
                                            }}
                                            type="button"
                                        >
                                            Add to Calendar
                                        </Button>
                                    </Link>
                                </div>
                                <br />

                                <div className="flex justify-center">
                                    <Link href="#">Cancel Reservation</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
