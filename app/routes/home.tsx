import { Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import { href, useNavigate } from "react-router";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import MeetingRoomFAQ from "~/components/MeetingRoomFAQ";
import { Room } from "~/lib/room";
import { site } from "~/lib/site";

export default function Component() {
    const navigate = useNavigate();

    return (
        <div className="flex justify-center">
            <title>{`Meeting Spaces • ${site.title}`}</title>
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <Header>
                        <div className="object-contain">
                            <img
                                className="rounded-t-md"
                                alt="A room of people in attendance at a meeting"
                                loading="lazy"
                                src="/meeting-spaces-header.jpg"
                            />
                        </div>
                    </Header>
                    <div className="ml-5 mr-5">
                        <div className="-mt-1 ml-1">
                            <Breadcrumbs links={site.breadcrumbs.home} />
                        </div>
                        <CardHeader className="-mt-3">
                            <h1 className="usa-card__heading py-2 font-sans text-[40px] font-bold">
                                Meeting Spaces
                            </h1>
                            <p className="text-base-darker font-sans text-sans-xs">
                                Austin Public Library Meeting Spaces are
                                <strong className="font-bold"> free of charge</strong> and ideal for
                                discussion groups, panels, and lectures. Both paper and online
                                reservation requests are timestamped and processed in the order they
                                are received.
                            </p>
                        </CardHeader>
                        <div className="flex-col px-3">
                            <Label htmlFor="reservation-select">Reserve Online</Label>
                            <Select
                                id="reservation-select"
                                name="reservation-select"
                                defaultValue="empty"
                                onChange={event => {
                                    const value = event.currentTarget.selectedOptions[0].value;
                                    if (value === "empty") {
                                        return;
                                    }

                                    const roomKind =
                                        value === "business"
                                            ? Room.Meeting.kind
                                            : Room.SharedLearning.kind;

                                    navigate(href("/:roomKind", { roomKind }));
                                }}
                            >
                                <option disabled value="empty">
                                    - Select -{" "}
                                </option>
                                <option value="nonprofit">
                                    Room for Non-Profit/Non-Commercial Activity
                                </option>
                                <option value="business">Room for Business/Company Work</option>
                            </Select>
                            <div className="my-4">
                                <strong>Reserve In-Person Instead</strong>
                                <ul className="ml-4 list-disc">
                                    <li>
                                        <Link href="#">Printable Form (PDF)</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Sala de Reunión Forma de Solicitud</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mx-4 mb-4">
                            <MeetingRoomFAQ />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
