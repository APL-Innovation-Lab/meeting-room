import {
    Button,
    Card,
    CardGroup,
    CardHeader,
    Checkbox,
    DatePicker,
    FormGroup,
    Label,
    Select,
    TextInputMask,
} from "@trussworks/react-uswds";
import { Form, Link, LinkProps } from "react-router";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Map as BranchMap } from "~/components/Map";
import lngLat from "~/data/lng-lat.json";
import { aplLive } from "~/lib/apl-client/apl-live-client.server";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";
import { SearchResult } from "./SearchResult";
import { ComponentProps, HTMLAttributes } from "react";

type BranchSearchResult = {
    branch: string;
    address: string;
    distance: string;
    roomsAvailable: number;
    image: string;
};

export async function loader({ params }: Route.LoaderArgs) {
    const roomsResult = await aplLive.getRooms();
    const grouped = new Map<string, BranchSearchResult>();

    if (!roomsResult.error && roomsResult.data) {
        for (const room of roomsResult.data) {
            const existing = grouped.get(room.branch.name);
            if (existing) {
                existing.roomsAvailable += 1;
                continue;
            }

            grouped.set(room.branch.name, {
                branch: room.branch.name,
                address: room.branch.address,
                distance: "0.0",
                roomsAvailable: 1,
                image: `https://library.austintexas.gov${room.branch.image}`,
            });
        }
    }

    return {
        searchResults: Array.from(grouped.values()),
        currentDate: new Intl.DateTimeFormat("en-CA").format(new Date()),
        branches: lngLat.map(location => location.branch),
        roomType: params.roomType as RoomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats: lngLat.map(branch => branch.lngLat as [number, number]),
    };
}

function ExternalLink({ children, className, ...props }: ComponentProps<"a">) {
    return (
        <a className={`usa-link usa-link--external ${className}`} {...props}>
            {children}
        </a>
    );
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const {
        searchResults,
        currentDate,
        branches,
        roomType,
        accessToken: mapboxToken,
        branchLngLats,
    } = loaderData;
    const isMeetingRoom = roomType === RoomType.MeetingRoom;
    const title = displayName(roomType);

    return (
        <>
            <title>{`${title} • ${site.title}`}</title>
            <CardGroup>
                <Card>
                    <div className="px-5">
                        <Breadcrumbs className="pb-0" links={site.breadcrumbs.search(roomType)} />
                        <CardHeader className="flex flex-col gap-[0.75rem]">
                            <h1 className="font-sans text-sans-2xl usa-card__heading font-bold">
                                {title}
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs">
                                {isMeetingRoom ? (
                                    <>
                                        For larger groups. Request 15 min time slots up to 15 hrs.
                                        Can reserve up to 90 days out.{" "}
                                        <ExternalLink href="https://library.austintexas.gov/meeting-rooms/calendar">
                                            View Booked Calendar
                                        </ExternalLink>
                                        <br />
                                        <br />
                                        <strong className="mr-2">Reserve In-Person Instead</strong>
                                        <ExternalLink
                                            className="mr-1"
                                            href="https://library.austintexas.gov/library/pdf/meeting_room_form_2023.pdf"
                                        >
                                            Printable Form (PDF)
                                        </ExternalLink>
                                        |
                                        <ExternalLink
                                            className="ml-1"
                                            href="https://library.austintexas.gov/library/pdf/meeting_room_form_2023_SPA.pdf"
                                        >
                                            Sala de reunión forma de solicitud
                                        </ExternalLink>
                                    </>
                                ) : (
                                    <>
                                        For smaller groups. Rooms can be booked up to 2 weeks and
                                        not less than 2 hours in advance. Book from 15 min up to 2
                                        hrs maximum.{" "}
                                        <ExternalLink href="https://library.austintexas.gov/slr/calendar">
                                            View Booked Calendar
                                        </ExternalLink>
                                    </>
                                )}
                            </p>
                        </CardHeader>

                        <Form className="flex flex-col px-3 w-full max-w-none">
                            <div className="w-full">
                                <Label className="font-bold" htmlFor="location" id="location-label">
                                    Location
                                </Label>
                                <Select className="max-w-none" id="location" name="location">
                                    <option value="all">All Available Locations</option>
                                    {branches.map(branch => (
                                        <option key={branch} value={branch}>
                                            {branch}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex gap-[1.25rem] justify-between">
                                <div className="w-full">
                                    <Label className="font-bold" htmlFor="date" id="date-label">
                                        Date
                                    </Label>
                                    <DatePicker
                                        id="date"
                                        name="date"
                                        defaultValue={currentDate}
                                        aria-labelledby="date-label"
                                    />
                                </div>

                                <div>
                                    <Label
                                        className="font-bold"
                                        htmlFor="duration"
                                        id="duration-label"
                                    >
                                        Duration
                                    </Label>
                                    <Select className="w-[10rem]" id="duration" name="duration">
                                        <option value="120">2 hr</option>
                                    </Select>
                                </div>

                                <div className="w-full">
                                    <Label
                                        className="font-bold"
                                        id="number-of-people-label"
                                        htmlFor="number-of-people"
                                    >
                                        Number of People
                                    </Label>
                                    <TextInputMask
                                        className="w-full"
                                        id="number-of-people"
                                        name="number-of-people"
                                        type="number"
                                        mask="___"
                                        pattern="\d{3}"
                                        aria-labelledby="number-of-people-label"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-[1.25rem] mt-3 justify-between items-center">
                                <div className="flex gap-[1.25rem] " id="amenities">
                                    <Checkbox id="display" name="display" label="Display/Screen" />
                                    <Checkbox id="hdmi" name="hdmi" label="HDMI" />
                                    <Checkbox
                                        id="whiteboard"
                                        name="whiteboard"
                                        label="Whiteboard"
                                    />
                                </div>
                                <Button className="w-auto" type="submit">
                                    Search
                                </Button>
                            </div>
                        </Form>

                        <div className="grid grid-cols-2 gap-[1rem] p-4">
                            <ul className="flex flex-col divide-y-[1px] divide-base-default gap-[1rem]">
                                {searchResults.filter(Boolean).map((result, idx) => (
                                    <SearchResult
                                        key={result.branch}
                                        index={idx + 1}
                                        image={result.image}
                                        branch={result.branch}
                                        distance={result.distance}
                                        address={result.address}
                                        roomsAvailable={result.roomsAvailable}
                                    />
                                ))}
                            </ul>
                            <BranchMap
                                className="w-full h-full"
                                branchLngLats={branchLngLats}
                                token={mapboxToken}
                            />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </>
    );
}
