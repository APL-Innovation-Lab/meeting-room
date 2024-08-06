import {
    Breadcrumb,
    BreadcrumbBar,
    BreadcrumbLink,
    Card,
    CardGroup,
    CardHeader,
    Header,
    Label,
    Link,
    Select,
} from "@trussworks/react-uswds";
import React from "react";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Meeting Spaces • ${parentTitle}` }]);

export default function Index() {
    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[62rem]">
                <Card>
                    <Header>
                        <div className="object-contain">
                            <img
                                alt="Public Meeting Room"
                                className="rounded-t-md"
                                loading="lazy"
                                src="/meetingSpacesHeader.jpg"
                            />
                        </div>
                        <BreadcrumbBar className="ml-2">
                            <Breadcrumb className="relative left-0">
                                <BreadcrumbLink href="#">
                                    <span>Home</span>
                                </BreadcrumbLink>
                            </Breadcrumb>
                            <Breadcrumb className="relative left-0">
                                <BreadcrumbLink href="#">
                                    <span>Meeting Spaces</span>
                                </BreadcrumbLink>
                            </Breadcrumb>
                        </BreadcrumbBar>
                    </Header>
                    <CardHeader className="-mt-2">
                        <h1 className="font usa-card__heading font-bold py-2">Meeting Spaces</h1>
                        <p className="font-sans text-base-darker text-left">
                            Austin Public Library Meeting Spaces are
                            <strong className="font-bold"> free of charge</strong> and ideal for
                            discussion groups, panels, and lectures. Both paper and online
                            reservation requests are timestamped and processed in the order they are
                            received.
                        </p>
                    </CardHeader>
                    <div className="flex-col px-3">
                        <Label htmlFor="reservation-select">Reserve Online</Label>
                        <Select id="reservation-select" name="reservation-select">
                            <React.Fragment key=".0">
                                <option disabled selected value="">
                                    - Select -{" "}
                                </option>
                                <option value="non-profit">
                                    Room for Non-Profit/Non-Commercial Activity
                                </option>
                                <option value="business">Room for Business/Company Work</option>
                            </React.Fragment>
                        </Select>
                        <div className="my-4">
                            <strong className="">Reserve In-Person Instead</strong>
                            <ul className="list-disc ml-4">
                                <li>
                                    <Link href="#">Printable Form (PDF)</Link>
                                </li>
                                <li>
                                    <Link href="#">Sala de Reunión Forma de Solicitud</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
