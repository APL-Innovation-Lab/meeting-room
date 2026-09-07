import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";
import { Suspense, use } from "react";

import { Breadcrumbs } from "~/components/Breadcrumbs";
import { apl, type SearchOptions } from "~/lib/apl-client/apl-live-client.server";
import { Room } from "~/lib/room";
import { site } from "~/lib/site";

import { Route } from "./+types/search";
import { CurrentLocationLink } from "./CurrentLocationLink";
import {
    branchNamesMatch,
    createLocationOptions,
    createRoomSearchResults,
    createSearchFilters,
    createSearchParams,
    createSearchResults,
    filterSearchResults,
    type BranchSearchResult,
    type LocationOption,
    type RoomSearchResult,
    type SearchFilters,
    type SuggestedAlternativeDay,
} from "./search.data.server";
import { SearchDescription } from "./SearchDescription";
import { SearchFiltersForm } from "./SearchFiltersForm";
import { SearchResultsPanel } from "./SearchResultsPanel";
import { useCurrentLocation } from "./useCurrentLocation";

// Default the search date to Austin's calendar day, not the server's. Without an explicit timeZone
// this formats in the host zone, so an evening Austin visitor on a UTC host would default to
// *tomorrow* (AV-6). en-CA yields the canonical "YYYY-MM-DD" shape the rest of the flow expects.
const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" });
const DEFER_GRACE_MS = 120;
const alternativeDayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});
const ALTERNATIVE_DAY_BATCH_SIZE = 7;
const ALTERNATIVE_DAY_LIMIT = 4;

function addUtcDays(date: Date, days: number): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

async function findSuggestedAlternativeDays({
    currentDate,
    roomKind,
    searchFilters,
    searchOptions,
}: {
    currentDate: string;
    roomKind: Room.Kind;
    searchFilters: SearchFilters;
    searchOptions: Partial<SearchOptions>;
}): Promise<SuggestedAlternativeDay[]> {
    const selectedDate = searchOptions.date;
    if (!selectedDate) return [];

    const today = new Date(`${currentDate}T00:00:00.000Z`);
    const bookingHorizonInDays = Room.isMeeting(roomKind) ? 90 : 14;
    const lastBookableDate = addUtcDays(today, bookingHorizonInDays);
    let nextDate = selectedDate < today ? today : addUtcDays(selectedDate, 1);
    const suggestedDates: Date[] = [];
    const searchRooms = Room.isMeeting(roomKind)
        ? (options: Partial<SearchOptions>) => apl.getMeetingRooms(options)
        : (options: Partial<SearchOptions>) => apl.getRooms(options);

    while (nextDate <= lastBookableDate && suggestedDates.length < ALTERNATIVE_DAY_LIMIT) {
        const batch: Date[] = [];
        while (batch.length < ALTERNATIVE_DAY_BATCH_SIZE && nextDate <= lastBookableDate) {
            batch.push(nextDate);
            nextDate = addUtcDays(nextDate, 1);
        }

        const availability = await Promise.all(
            batch.map(async date => {
                const result = await searchRooms({ ...searchOptions, date });
                return {
                    date,
                    failed: Boolean(result.error),
                    hasRooms: !result.error && result.data.length > 0,
                };
            }),
        );

        if (availability.every(candidate => candidate.failed)) break;
        suggestedDates.push(
            ...availability
                .filter(candidate => candidate.hasRooms)
                .map(candidate => candidate.date),
        );
    }

    return suggestedDates.slice(0, ALTERNATIVE_DAY_LIMIT).map(date => {
        const isoDate = date.toISOString().slice(0, 10);
        return {
            date: isoDate,
            label: alternativeDayFormatter.format(date).replace(",", ""),
            searchUrl: `?${createSearchParams(searchFilters, { date: isoDate })}`,
        };
    });
}

type DeferredSearchData =
    | {
          mode: "branches";
          searchResults: BranchSearchResult[];
      }
    | {
          mode: "rooms";
          branch: string;
          roomResults: RoomSearchResult[];
          suggestedAlternativeDays: SuggestedAlternativeDay[];
      };

interface SearchPageData {
    locationOptions: LocationOption[];
    deferredSearchData: Promise<DeferredSearchData>;
}

async function resolveDeferredSearchData({
    roomKind,
    currentDate,
    searchFilters,
    initialSearchResults,
}: {
    currentDate: string;
    roomKind: Room.Kind;
    searchFilters: SearchFilters;
    initialSearchResults: BranchSearchResult[];
}): Promise<DeferredSearchData> {
    const parsedDate = new Date(searchFilters.date);
    const parsedPeople = Number.parseInt(searchFilters.people, 10);
    const parsedDuration = Number.parseInt(searchFilters.duration, 10);
    const searchOptions = {
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
    };

    if (searchFilters.location !== "all") {
        const selectedBranch = initialSearchResults[0];
        if (!selectedBranch) {
            return {
                mode: "rooms",
                branch: searchFilters.location,
                roomResults: [],
                suggestedAlternativeDays: [],
            };
        }

        const roomsResult = Room.isMeeting(roomKind)
            ? await apl.getMeetingRooms(searchOptions)
            : await apl.getRooms(searchOptions);
        if (roomsResult.error) throw roomsResult.error;

        const roomResults = createRoomSearchResults(roomsResult.data, selectedBranch);
        return {
            mode: "rooms",
            branch: selectedBranch.branch,
            roomResults,
            suggestedAlternativeDays:
                roomResults.length === 0
                    ? await findSuggestedAlternativeDays({
                          currentDate,
                          roomKind,
                          searchFilters,
                          searchOptions,
                      })
                    : [],
        };
    }

    let searchResults = initialSearchResults;
    const maxAvailableDurationByLocationId = new Map<string, number>();

    if (Room.isSharedLearning(roomKind)) {
        const roomsResult = await apl.getRooms(searchOptions);
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
    } else {
        const availabilityResult = await apl.getMeetingRoomAvailabilityByLocation(searchOptions);
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
        mode: "branches",
        searchResults: resolvedSearchResults,
    };
}

async function resolveSearchPageData({
    roomKind,
    searchFilters,
    currentDate,
}: {
    roomKind: Room.Kind;
    searchFilters: SearchFilters;
    currentDate: string;
}): Promise<SearchPageData> {
    const [meetingOrSharedResult, branchDirectoryResult, branchCoordinatesResult] =
        await Promise.all([
            Room.isMeeting(roomKind)
                ? apl.getMeetingRoomBranches()
                : apl.getSharedLearningRoomBranches(),
            apl.getBranchDirectory(),
            apl.getBranchCoordinates(),
        ]);

    const locationBranches = !meetingOrSharedResult.error ? meetingOrSharedResult.data : [];
    const branchDirectory = !branchDirectoryResult.error ? branchDirectoryResult.data : [];
    const branchCoordinates =
        !branchCoordinatesResult.error && branchCoordinatesResult.data
            ? branchCoordinatesResult.data
            : [];
    const allSearchResults = createSearchResults(
        locationBranches,
        branchDirectory,
        branchCoordinates,
        roomKind,
        searchFilters,
    );
    const initialSearchResults = filterSearchResults(allSearchResults, searchFilters);
    const deferredSearchDataPromise = resolveDeferredSearchData({
        currentDate,
        roomKind,
        searchFilters,
        initialSearchResults,
    });
    const maybeResolved = await Promise.race([
        deferredSearchDataPromise.then(
            data => ({ type: "resolved" as const, data }),
            () => ({ type: "rejected" as const }),
        ),
        new Promise<{ type: "timeout" }>(resolve =>
            setTimeout(() => resolve({ type: "timeout" }), DEFER_GRACE_MS),
        ),
    ]);

    return {
        locationOptions: createLocationOptions(allSearchResults),
        deferredSearchData:
            maybeResolved.type === "resolved"
                ? Promise.resolve(maybeResolved.data)
                : deferredSearchDataPromise,
    };
}

export async function loader({ params, url }: Route.LoaderArgs) {
    const roomKind = params.roomKind as Room.Kind;
    const rawSearchParams = url.searchParams;
    const currentDate = dateFormatter.format(new Date());
    const searchFilters = createSearchFilters(rawSearchParams, currentDate);
    const hasAnyQueryParams = Array.from(rawSearchParams.keys()).length > 0;
    const hasAnyNonLocationFilter = Array.from(rawSearchParams.entries()).some(
        ([key, value]) => key !== "location" && value.trim() !== "",
    );
    const searchResultsHeading =
        searchFilters.location !== "all"
            ? searchFilters.location
            : hasAnyQueryParams && hasAnyNonLocationFilter
              ? "Results for All Locations"
              : "All Available Locations";
    const searchPageData = resolveSearchPageData({
        currentDate,
        roomKind,
        searchFilters,
    });

    return {
        searchFilters,
        currentDate,
        roomKind,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        searchResultsHeading,
        searchPageData,
        deferredSearchData: searchPageData.then(data => data.deferredSearchData),
    };
}

const EMPTY_LOCATION_OPTIONS: LocationOption[] = [];

function SearchFiltersContent({
    currentDate,
    searchFilters,
    searchPageData,
}: {
    currentDate: string;
    searchFilters: SearchFilters;
    searchPageData: Promise<SearchPageData>;
}) {
    const { locationOptions } = use(searchPageData);

    return (
        <SearchFiltersForm
            currentDate={currentDate}
            locationOptions={locationOptions}
            searchFilters={searchFilters}
        />
    );
}

function SearchFiltersLoading({
    currentDate,
    searchFilters,
}: {
    currentDate: string;
    searchFilters: SearchFilters;
}) {
    return (
        <SearchFiltersForm
            currentDate={currentDate}
            isInitialLoading
            locationOptions={EMPTY_LOCATION_OPTIONS}
            searchFilters={searchFilters}
        />
    );
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const {
        searchFilters,
        currentDate,
        roomKind,
        accessToken: mapboxToken,
        searchPageData,
        searchResultsHeading,
        deferredSearchData,
    } = loaderData;
    const room = new Room(roomKind);
    const currentLocation = useCurrentLocation(mapboxToken);

    return (
        <>
            <title>{`${room.displayName} • ${site.title}`}</title>
            <main>
                <CardGroup>
                    <Card>
                        <div className="px-5">
                            <div className="flex flex-wrap items-center justify-between gap-[0.5rem] pr-2">
                                <Breadcrumbs
                                    className="pb-0"
                                    links={site.breadcrumbs.search(room)}
                                />
                                {searchFilters.location === "all" ? (
                                    <CurrentLocationLink {...currentLocation} />
                                ) : null}
                            </div>
                            <CardHeader className="flex flex-col gap-[0.75rem]">
                                <h1 className="font-sans text-sans-2xl font-bold usa-card__heading">
                                    {room.displayName}
                                </h1>
                                <p className="font-sans text-sans-xs text-base-darker">
                                    <SearchDescription roomKind={roomKind} />
                                </p>
                            </CardHeader>

                            <Suspense
                                fallback={
                                    <SearchFiltersLoading
                                        currentDate={currentDate}
                                        searchFilters={searchFilters}
                                    />
                                }
                            >
                                <SearchFiltersContent
                                    currentDate={currentDate}
                                    searchFilters={searchFilters}
                                    searchPageData={searchPageData}
                                />
                            </Suspense>
                            <SearchResultsPanel
                                deferredSearchData={deferredSearchData}
                                heading={searchResultsHeading}
                                mapboxToken={mapboxToken}
                                searchFilters={searchFilters}
                                userLngLat={currentLocation.location?.lngLat}
                            />
                        </div>
                    </Card>
                </CardGroup>
            </main>
        </>
    );
}
