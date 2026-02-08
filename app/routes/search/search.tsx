import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { apl } from "~/lib/apl-client/apl-live-client.server";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";
import { SearchDescription } from "./SearchDescription";
import { SearchFiltersForm } from "./SearchFiltersForm";
import { SearchResultsPanel } from "./SearchResultsPanel";
import {
    branchNamesMatch,
    createBranchLngLats,
    createSearchFilters,
    createLocationOptions,
    createSearchResults,
    filterSearchResults,
} from "./search.data.server";

const dateFormatter = new Intl.DateTimeFormat("en-CA");

export async function loader({ params, request }: Route.LoaderArgs) {
    const roomType = params.roomType as RoomType;

    const [
        meetingOrSharedResult,
        branchDirectoryResult,
        branchCoordinatesResult,
        locationPathResult,
    ] = await Promise.all([
        roomType === RoomType.MeetingRoom
            ? apl.getMeetingRoomBranches()
            : apl.getSharedLearningRoomBranches(),
        apl.getBranchDirectory(),
        apl.getBranchCoordinates(),
        apl.getLocationPathMapping(),
    ]);

    const locationBranches = !meetingOrSharedResult.error ? meetingOrSharedResult.data : [];
    const branchDirectory = !branchDirectoryResult.error ? branchDirectoryResult.data : [];
    const liveBranchCoordinates = !branchCoordinatesResult.error
        ? branchCoordinatesResult.data
        : [];
    const locationPathMapping = !locationPathResult.error ? locationPathResult.data : {};

    const allSearchResults = createSearchResults(
        locationBranches,
        branchDirectory,
        locationPathMapping,
    );
    const currentDate = dateFormatter.format(new Date());
    const searchFilters = createSearchFilters(new URL(request.url).searchParams, currentDate);
    let searchResults = filterSearchResults(allSearchResults, searchFilters);
    const maxAvailableDurationByLocationId = new Map<string, number>();

    if (roomType === RoomType.SharedLearningRoom) {
        const parsedDate = new Date(searchFilters.date);
        const parsedPeople = Number.parseInt(searchFilters.people, 10);
        const parsedDuration = Number.parseInt(searchFilters.duration, 10);
        const roomsResult = await apl.getRooms({
            location: searchFilters.location === "all" ? undefined : searchFilters.location,
            date: Number.isNaN(parsedDate.valueOf()) ? undefined : parsedDate,
            capacity: Number.isFinite(parsedPeople) && parsedPeople > 0 ? parsedPeople : undefined,
            duration:
                Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined,
            amenities: {
                airplay: searchFilters.display || undefined,
                hdmi: searchFilters.hdmi || undefined,
                whiteboard: searchFilters.whiteboard || undefined,
            },
        });

        if (!roomsResult.error) {
            searchResults = searchResults.filter(result =>
                roomsResult.data.some(room => branchNamesMatch(result.branch, room.branch.name)),
            );

            for (const result of searchResults) {
                const maxDuration = Math.max(
                    0,
                    ...roomsResult.data
                        .filter(room => branchNamesMatch(result.branch, room.branch.name))
                        .map(room => Math.max(0, ...room.info.availableDurations)),
                );
                if (maxDuration > 0) {
                    maxAvailableDurationByLocationId.set(result.locationId, maxDuration);
                }
            }
        }
    } else if (roomType === RoomType.MeetingRoom) {
        const parsedDate = new Date(searchFilters.date);
        const parsedPeople = Number.parseInt(searchFilters.people, 10);
        const parsedDuration = Number.parseInt(searchFilters.duration, 10);
        const availabilityResult = await apl.getMeetingRoomAvailabilityByLocation({
            location: searchFilters.location === "all" ? undefined : searchFilters.location,
            date: Number.isNaN(parsedDate.valueOf()) ? undefined : parsedDate,
            capacity: Number.isFinite(parsedPeople) && parsedPeople > 0 ? parsedPeople : undefined,
            duration:
                Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined,
        });

        if (!availabilityResult.error) {
            const availableLocationIds = new Set(Object.keys(availabilityResult.data));
            searchResults = searchResults.filter(result =>
                availableLocationIds.has(result.locationId),
            );

            for (const [locationId, availability] of Object.entries(availabilityResult.data)) {
                const maxDuration = Math.max(0, ...availability.availableDurations);
                if (maxDuration > 0) {
                    maxAvailableDurationByLocationId.set(locationId, maxDuration);
                }
            }
        }
    }

    searchResults = searchResults.map(result => ({
        ...result,
        maxAvailableDuration: maxAvailableDurationByLocationId.get(result.locationId),
    }));

    return {
        searchResults,
        searchFilters,
        currentDate,
        locationOptions: createLocationOptions(allSearchResults),
        roomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats: createBranchLngLats(searchResults, liveBranchCoordinates),
    };
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const {
        searchResults,
        searchFilters,
        currentDate,
        locationOptions,
        roomType,
        accessToken: mapboxToken,
        branchLngLats,
    } = loaderData;
    const title = displayName(roomType);

    return (
        <>
            <title>{`${title} • ${site.title}`}</title>
            <CardGroup>
                <Card>
                    <div className="px-5">
                        <Breadcrumbs className="pb-0" links={site.breadcrumbs.search(roomType)} />
                        <CardHeader className="flex flex-col gap-[0.75rem]">
                            <h1 className="usa-card__heading font-sans text-sans-2xl font-bold">
                                {title}
                            </h1>
                            <p className="font-sans text-sans-xs text-base-darker">
                                <SearchDescription roomType={roomType} />
                            </p>
                        </CardHeader>

                        <SearchFiltersForm
                            currentDate={currentDate}
                            locationOptions={locationOptions}
                            searchFilters={searchFilters}
                        />
                        <SearchResultsPanel
                            searchResults={searchResults}
                            branchLngLats={branchLngLats}
                            mapboxToken={mapboxToken}
                        />
                    </div>
                </Card>
            </CardGroup>
        </>
    );
}
