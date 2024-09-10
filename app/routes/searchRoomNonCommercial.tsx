import { Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import Breadcrumbs from "~/components/Breadcrumbs";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Search for a room - Non-Commercial • ${parentTitle}` }]);

export default function searchRoomNonCommercial() {
    const breadcrumbLinks = [
        { href: "#", text: "Home" },
        { href: "#", text: "Meeting Spaces" },
        { href: "#", text: "Search for a room - Non-Commercial" },
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

                            <p className="font-sans text-base-darker text-sans-xs">
                            For smaller groups, please consider our Shared Learning Rooms with capacities of 4, 8, and 10. 
                            Groups up to 20+ to 100 people are better for Meeting Rooms.
                            </p>
                        </CardHeader>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}



