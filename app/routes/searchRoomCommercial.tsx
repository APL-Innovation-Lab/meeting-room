import { Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import Breadcrumbs from "~/components/Breadcrumbs";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Search for a room - Commercial • ${parentTitle}` }]);


export default function searchRoomCommercial() {
    const breadcrumbLinks = [
        { href: "#", text: "Home" },
        { href: "#", text: "Meeting Spaces" },
        { href: "#", text: "Search for a room - Commercial" },
    ];

    return (

        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <Header>
                        <div className="object-contain">
                            <img
                                alt="A room of people in attendance at a meeting"
                                className="rounded-t-md"
                                loading="lazy"
                                src="/meeting-spaces-header.jpg"
                            />
                        </div>
                    </Header>
                    <div className="ml-5 mr-5">
                        <div className="-mt-1 ml-1">
                            <Breadcrumbs links={breadcrumbLinks} />
                        </div>
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2">
                                FIND A ROOM
                            </h1>
                            <h1 className="usa-card__heading">COMMERCIAL/BUSINESS</h1>
                            <br/>

                            <p className="font-sans text-base-darker text-sans-xs">
                            <strong className="font-bold">Rooms for commercial work purposes are only available at capacities of 4, 8, and 10. </strong>
                            Rooms can be booked in 15 min time blocks up to 2-hours, and up to 2 weeks out.
                            </p>
                        </CardHeader>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}



