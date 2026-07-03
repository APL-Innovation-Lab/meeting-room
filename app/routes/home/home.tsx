import { Card, CardGroup, CardHeader, Header, Link } from "@trussworks/react-uswds";

import { Breadcrumbs } from "~/components/Breadcrumbs.tsx";
import { site } from "~/lib/site.ts";

import { PrimaryHeader } from "./Header.tsx";
import { MeetingRoomFaq } from "./MeetingRoomFaq.tsx";
import { RoomSelector } from "./RoomCard.tsx";

export default function Component() {
    return (
        <div className="flex justify-center">
            <title>{`Meeting Spaces • ${site.title}`}</title>
            <CardGroup className="min-w-120 max-w-196">
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
                        <Breadcrumbs links={site.breadcrumbs.home} />
                        <CardHeader className="-mt-3">
                            <h1 className="usa-card__heading py-2 font-sans text-[40px] font-bold">
                                Meeting Spaces
                            </h1>
                            <p className="text-base-darker font-sans text-sans-xs">
                                Austin Public Library Meeting Spaces are
                                <strong className="font-bold"> free of charge</strong>.
                            </p>
                        </CardHeader>
                        <div className="flex-col px-3 pt-4">
                            <RoomSelector.Group>
                                <RoomSelector.Card kind="shared-learning-room" />
                                <RoomSelector.Card kind="meeting-room" />
                            </RoomSelector.Group>
                            <div className="my-4">
                                <PrimaryHeader>Guidelines and Policy</PrimaryHeader>
                                <ul>
                                    <li>
                                        <Link href="#">Shared Learning Room Policy</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Meeting Rooms Policy</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Care and Use Facility Guidelines</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mx-4 mb-4">
                            <MeetingRoomFaq />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
