import { Suspense, use, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Map as BranchMap } from "~/components/Map";
import { type LiveBranchCoordinate } from "~/lib/apl-client/apl-live-client.server";
import { apl } from "~/lib/apl-client/apl-live-client.server";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";
import { SearchDescription } from "./SearchDescription";
import { SearchFiltersForm } from "./SearchFiltersForm";
import { SearchResult } from "./SearchResult";
import {
    branchNamesMatch,
    createBranchLngLats,
    createSearchFilters,
    createLocationOptions,
    createSearchResults,
    filterSearchResults,
    type BranchSearchResult,
    type SearchFilters,
} from "./search.data.server";

const dateFormatter = new Intl.DateTimeFormat("en-CA");
const DEFER_GRACE_MS = 120;
const SPINNER_DELAY_MS = 180;

type DeferredSearchData = {
    searchResults: BranchSearchResult[];
    branchLngLats: Array<[number, number]>;
};

async function resolveDeferredSearchData({
    roomType,
    searchFilters,
    initialSearchResults,
    liveBranchCoordinates,
}: {
    roomType: RoomType;
    searchFilters: SearchFilters;
    initialSearchResults: BranchSearchResult[];
    liveBranchCoordinates: LiveBranchCoordinate[];
}): Promise<DeferredSearchData> {
    let searchResults = initialSearchResults;
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

    const resolvedSearchResults = searchResults.map(result => ({
        ...result,
        maxAvailableDuration: maxAvailableDurationByLocationId.get(result.locationId),
    }));

    return {
        searchResults: resolvedSearchResults,
        branchLngLats: createBranchLngLats(resolvedSearchResults, liveBranchCoordinates),
    };
}

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
    const liveBranchCoordinates =
        !branchCoordinatesResult.error && branchCoordinatesResult.data
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
    const initialSearchResults = filterSearchResults(allSearchResults, searchFilters);
    const deferredSearchDataPromise = resolveDeferredSearchData({
        roomType,
        searchFilters,
        initialSearchResults,
        liveBranchCoordinates,
    });
    const maybeResolved = await Promise.race([
        deferredSearchDataPromise.then(data => ({ type: "resolved" as const, data })),
        new Promise<{ type: "timeout" }>(resolve =>
            setTimeout(() => resolve({ type: "timeout" }), DEFER_GRACE_MS),
        ),
    ]);
    const deferredSearchData =
        maybeResolved.type === "resolved"
            ? Promise.resolve(maybeResolved.data)
            : deferredSearchDataPromise;

    return {
        searchFilters,
        currentDate,
        locationOptions: createLocationOptions(allSearchResults),
        roomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        deferredSearchData,
    };
}

function DeferredSearchResultsList({
    deferredSearchData,
}: {
    deferredSearchData: Promise<DeferredSearchData>;
}) {
    const { searchResults } = use(deferredSearchData);
    return (
        <ul className="flex flex-col gap-[1rem] divide-y-[1px] divide-base-light overflow-scroll">
            {searchResults.filter(Boolean).map((result, idx) => (
                <SearchResult
                    key={result.branch}
                    index={idx + 1}
                    image={result.image}
                    branch={result.branch}
                    distance={result.distance}
                    address={result.address}
                    roomsAvailable={result.roomsAvailable}
                    maxAvailableDuration={result.maxAvailableDuration}
                    url={result.url}
                />
            ))}
        </ul>
    );
}

function DeferredBranchMap({
    deferredSearchData,
    mapboxToken,
}: {
    deferredSearchData: Promise<DeferredSearchData>;
    mapboxToken: string;
}) {
    const [branchLngLats, setBranchLngLats] = useState<Array<[number, number]>>([]);

    useEffect(() => {
        let isCancelled = false;
        setBranchLngLats([]);

        deferredSearchData
            .then(data => {
                if (!isCancelled) setBranchLngLats(data.branchLngLats);
            })
            .catch(() => {
                if (!isCancelled) setBranchLngLats([]);
            });

        return () => {
            isCancelled = true;
        };
    }, [deferredSearchData]);

    return <BranchMap className="h-full w-full" branchLngLats={branchLngLats} token={mapboxToken} />;
}

function SearchResultsListFallback() {
    const [showSpinner, setShowSpinner] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);
        return () => window.clearTimeout(timeoutId);
    }, []);

    if (!showSpinner) {
        return <div className="h-full" aria-hidden="true" />;
    }

    return (
        <div className="flex h-full items-center justify-center">
            <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="#007ea8"
                    strokeWidth="3"
                    strokeDasharray="40 24"
                />
            </svg>
        </div>
    );
}

function SearchResultsListError() {
    return (
        <div className="flex h-full items-center justify-center text-center text-secondary-dark">
            Could not load room availability right now.
        </div>
    );
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const {
        searchFilters,
        currentDate,
        locationOptions,
        roomType,
        accessToken: mapboxToken,
        deferredSearchData,
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
                        <div className="grid h-[45rem] grid-cols-2 gap-[1rem] overflow-hidden p-4">
                            <Suspense fallback={<SearchResultsListFallback />}>
                                <ErrorBoundary fallback={<SearchResultsListError />}>
                                    <DeferredSearchResultsList
                                        deferredSearchData={deferredSearchData}
                                    />
                                </ErrorBoundary>
                            </Suspense>
                            <DeferredBranchMap
                                deferredSearchData={deferredSearchData}
                                mapboxToken={mapboxToken}
                            />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </>
    );
}
