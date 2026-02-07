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
import { Form } from "react-router";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Map as BranchMap } from "~/components/Map";
import { aplLive } from "~/lib/apl-client/apl-live-client.server";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";
import { SearchResult } from "./SearchResult";
import { ComponentProps } from "react";

type BranchSearchResult = {
    locationId: string;
    branch: string;
    address: string;
    distance: string;
    roomsAvailable: number;
    image: string;
    url: string;
};

function normalizeBranchName(value: string): string {
    return value
        .toLowerCase()
        .replace(/^austin\s+/g, "")
        .replace(/^george washington\s+/g, "")
        .replace(/\s*[\(,]\s*faulk building\)?\s*$/g, "")
        .replace(/\s+faulk building$/g, "")
        .replace(/\snorth village\s*/g, " north village ")
        .replace(/\sjohn gillum branch/g, "north village branch")
        .replace(/&/g, "and")
        .replace(/[|,].*$/g, "")
        .replace(/[().]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function branchNamesMatch(a: string, b: string): boolean {
    const left = normalizeBranchName(a);
    const right = normalizeBranchName(b);
    return left === right || left.includes(right) || right.includes(left);
}

function toAbsoluteImagePath(image: string): string {
    if (!image) return "https://library.austintexas.gov/library/slr-408.jpg";
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    return `https://library.austintexas.gov${image}`;
}

function toAbsoluteBranchUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return `https://library.austintexas.gov${path}`;
    return "https://library.austintexas.gov/locations";
}

export async function loader({ params }: Route.LoaderArgs) {
    const roomType = params.roomType as RoomType;
    const branchDirectoryPromise = aplLive.getBranchDirectory();
    const branchCoordinatesPromise = aplLive.getBranchCoordinates();
    const locationPathMappingPromise = aplLive.getLocationPathMapping();
    const grouped = new Map<string, BranchSearchResult>();
    const branchInfo = new Map<string, { address: string; image: string; path: string }>();
    const locationPathById = new Map<string, string>();
    let locationBranches:
        | Array<{ locationId: string; branch: string; roomsAvailable: number }>
        | undefined;

    const [branchDirectoryResult, branchCoordinatesResult, locationPathMappingResult] = await Promise.all([
        branchDirectoryPromise,
        branchCoordinatesPromise,
        locationPathMappingPromise,
    ]);

    if (roomType === RoomType.MeetingRoom) {
        const meetingBranchesResult = await aplLive.getMeetingRoomBranches();
        locationBranches =
            !meetingBranchesResult.error && meetingBranchesResult.data
                ? meetingBranchesResult.data
                : [];
    } else {
        const sharedLearningBranchesResult = await aplLive.getSharedLearningRoomBranches();
        locationBranches =
            !sharedLearningBranchesResult.error && sharedLearningBranchesResult.data
                ? sharedLearningBranchesResult.data
                : [];
    }

    if (!branchDirectoryResult.error && branchDirectoryResult.data) {
        for (const branch of branchDirectoryResult.data) {
            const key = normalizeBranchName(branch.branch);
            if (branchInfo.has(key)) continue;
            branchInfo.set(key, {
                address: branch.address,
                image: branch.image,
                path: branch.path,
            });
        }
    }
    if (!locationPathMappingResult.error && locationPathMappingResult.data) {
        for (const [locationId, path] of Object.entries(locationPathMappingResult.data)) {
            locationPathById.set(locationId, path);
        }
    }

    if (locationBranches) {
        for (const branch of locationBranches) {
            const info = branchInfo.get(normalizeBranchName(branch.branch));
            grouped.set(branch.locationId, {
                locationId: branch.locationId,
                branch: branch.branch,
                address: info?.address ?? "",
                distance: "0.0",
                roomsAvailable: branch.roomsAvailable,
                image: toAbsoluteImagePath(info?.image ?? ""),
                url: toAbsoluteBranchUrl(locationPathById.get(branch.locationId) ?? info?.path ?? ""),
            });
        }
    }

    const searchResults = Array.from(grouped.values());
    const liveBranchCoordinates = !branchCoordinatesResult.error && branchCoordinatesResult.data
        ? branchCoordinatesResult.data
        : [];
    const branchLngLats = searchResults
        .map(result =>
            liveBranchCoordinates.find(candidate => branchNamesMatch(result.branch, candidate.branch))?.lngLat,
        )
        .filter((value): value is [number, number] => Boolean(value));

    return {
        searchResults,
        currentDate: new Intl.DateTimeFormat("en-CA").format(new Date()),
        branches: searchResults.map(result => result.branch),
        roomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats,
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

                        <div className="grid grid-cols-2 gap-[1rem] p-4 h-[45rem] overflow-hidden">
                            <ul className="flex flex-col divide-y-[1px] divide-base-default gap-[1rem] overflow-scroll">
                                {searchResults.filter(Boolean).map((result, idx) => (
                                    <SearchResult
                                        key={result.branch}
                                        index={idx + 1}
                                        image={result.image}
                                        branch={result.branch}
                                        distance={result.distance}
                                        address={result.address}
                                        roomsAvailable={result.roomsAvailable}
                                        url={result.url}
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
