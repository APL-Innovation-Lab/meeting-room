import { Suspense, use, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Map as BranchMap } from "~/components/Map";
import { Spinner } from "~/components/Spinner";

import { RoomSearchResult } from "./RoomSearchResult";
import {
    type BranchSearchResult,
    type RoomSearchResult as RoomSearchResultData,
    type SearchFilters,
} from "./search.data.server";
import { SearchResult } from "./SearchResult";

export namespace SearchResultsPanel {
    export type DeferredSearchData =
        | {
              mode: "branches";
              searchResults: BranchSearchResult[];
              branchLngLats: Array<[number, number]>;
          }
        | {
              mode: "rooms";
              branch: string;
              roomResults: RoomSearchResultData[];
          };

    export interface Props {
        heading?: string;
        searchData?: DeferredSearchData;
        deferredSearchData?: Promise<DeferredSearchData>;
        mapboxToken: string;
        searchFilters: SearchFilters;
    }
}

function SearchResultsList({ searchResults }: { searchResults: BranchSearchResult[] }) {
    return (
        <ul className="flex flex-col gap-[1rem] divide-y divide-base-light overflow-scroll">
            {searchResults.filter(Boolean).map((result, index) => (
                <SearchResult
                    address={result.address}
                    branch={result.branch}
                    distance={result.distance}
                    image={result.image}
                    index={index + 1}
                    key={result.locationId}
                    maxAvailableDuration={result.maxAvailableDuration}
                    roomsAvailable={result.roomsAvailable}
                    searchUrl={result.searchUrl}
                />
            ))}
        </ul>
    );
}

function DeferredSearchResultsList({
    deferredSearchData,
}: {
    deferredSearchData: Promise<SearchResultsPanel.DeferredSearchData>;
}) {
    const data = use(deferredSearchData);
    return data.mode === "branches" ? (
        <SearchResultsList searchResults={data.searchResults} />
    ) : null;
}

function DeferredBranchMap({
    deferredSearchData,
    mapboxToken,
}: {
    deferredSearchData: Promise<SearchResultsPanel.DeferredSearchData>;
    mapboxToken: string;
}) {
    const [branchLngLats, setBranchLngLats] = useState<Array<[number, number]>>([]);

    useEffect(() => {
        let isCancelled = false;
        setBranchLngLats([]);

        deferredSearchData
            .then(data => {
                if (!isCancelled && data.mode === "branches") {
                    setBranchLngLats(data.branchLngLats);
                }
            })
            .catch(() => {
                if (!isCancelled) setBranchLngLats([]);
            });

        return () => {
            isCancelled = true;
        };
    }, [deferredSearchData]);

    return (
        <BranchMap className="h-full w-full" branchLngLats={branchLngLats} token={mapboxToken} />
    );
}

function SearchResultsListFallback() {
    return (
        <div className="mt-4 flex h-full items-start justify-center" role="status">
            <Spinner className="h-8 w-8" />
            <span className="sr-only">Loading room availability…</span>
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

function BranchSearchResults({
    deferredSearchData,
    heading,
    mapboxToken,
    searchData,
}: {
    deferredSearchData?: Promise<SearchResultsPanel.DeferredSearchData>;
    heading: string;
    mapboxToken: string;
    searchData?: SearchResultsPanel.DeferredSearchData;
}) {
    const branchData =
        searchData?.mode === "branches"
            ? searchData
            : { mode: "branches" as const, searchResults: [], branchLngLats: [] };

    return (
        <div className="flex flex-col gap-[0.5rem] overflow-hidden px-4 pb-4">
            <h4 className="pt-2 font-bold" aria-level={2}>
                {heading}
            </h4>
            <div className="grid h-[45rem] grid-cols-2 gap-[1rem] pt-2">
                {deferredSearchData ? (
                    <>
                        <Suspense fallback={<SearchResultsListFallback />}>
                            <ErrorBoundary
                                fallback={<SearchResultsListError />}
                                resetKeys={[deferredSearchData]}
                            >
                                <DeferredSearchResultsList
                                    deferredSearchData={deferredSearchData}
                                />
                            </ErrorBoundary>
                        </Suspense>
                        <DeferredBranchMap
                            deferredSearchData={deferredSearchData}
                            mapboxToken={mapboxToken}
                        />
                    </>
                ) : (
                    <>
                        <SearchResultsList searchResults={branchData.searchResults} />
                        <BranchMap
                            className="h-full w-full"
                            branchLngLats={branchData.branchLngLats}
                            token={mapboxToken}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

function RoomSearchResults({
    branch,
    roomResults,
    searchFilters,
}: {
    branch: string;
    roomResults: RoomSearchResultData[];
    searchFilters: SearchFilters;
}) {
    return (
        <section aria-labelledby="room-results-heading">
            <h2
                className="border-b border-base-light py-3 font-sans text-sans-md font-bold"
                id="room-results-heading"
            >
                {branch}
            </h2>
            {roomResults.length > 0 ? (
                <ul className="list-none divide-y divide-base-light p-0">
                    {roomResults.map((result, index) => (
                        <li key={result.roomId}>
                            <RoomSearchResult
                                filters={searchFilters}
                                priority={index === 0}
                                result={result}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="py-5 text-base-darker">No rooms match these filters at {branch}.</p>
            )}
        </section>
    );
}

function DeferredRoomSearchResults({
    deferredSearchData,
    searchFilters,
}: {
    deferredSearchData: Promise<SearchResultsPanel.DeferredSearchData>;
    searchFilters: SearchFilters;
}) {
    const data = use(deferredSearchData);
    return data.mode === "rooms" ? (
        <RoomSearchResults
            branch={data.branch}
            roomResults={data.roomResults}
            searchFilters={searchFilters}
        />
    ) : null;
}

function SearchResultsFallback() {
    return (
        <div className="mt-4 flex min-h-32 items-start justify-center" role="status">
            <Spinner className="h-8 w-8" />
            <span className="sr-only">Loading room availability…</span>
        </div>
    );
}

function SearchResultsError() {
    return (
        <div
            className="flex min-h-32 items-center justify-center text-center text-secondary-dark"
            role="alert"
        >
            Could not load room availability right now.
        </div>
    );
}

export function SearchResultsPanel({
    deferredSearchData,
    heading = "All Available Locations",
    mapboxToken,
    searchData,
    searchFilters,
}: SearchResultsPanel.Props) {
    const isRoomMode = searchFilters.location !== "all" || searchData?.mode === "rooms";

    if (!isRoomMode) {
        return (
            <BranchSearchResults
                deferredSearchData={deferredSearchData}
                heading={heading}
                mapboxToken={mapboxToken}
                searchData={searchData}
            />
        );
    }

    const fallbackData: SearchResultsPanel.DeferredSearchData = {
        mode: "rooms",
        branch: searchFilters.location,
        roomResults: [],
    };

    return (
        <div className="px-4 pb-4">
            {deferredSearchData ? (
                <Suspense fallback={<SearchResultsFallback />}>
                    <ErrorBoundary
                        fallback={<SearchResultsError />}
                        resetKeys={[deferredSearchData]}
                    >
                        <DeferredRoomSearchResults
                            deferredSearchData={deferredSearchData}
                            searchFilters={searchFilters}
                        />
                    </ErrorBoundary>
                </Suspense>
            ) : (
                <RoomSearchResults
                    branch={
                        searchData?.mode === "rooms" ? searchData.branch : searchFilters.location
                    }
                    roomResults={
                        searchData?.mode === "rooms"
                            ? searchData.roomResults
                            : fallbackData.roomResults
                    }
                    searchFilters={searchFilters}
                />
            )}
        </div>
    );
}
