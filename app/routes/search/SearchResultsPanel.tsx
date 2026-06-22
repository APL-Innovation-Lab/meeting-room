import { Suspense, use, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Map as BranchMap } from "~/components/Map";
import { Spinner } from "~/components/Spinner";

import { type BranchSearchResult } from "./search.data.server";
import { SearchResult } from "./SearchResult";

export namespace SearchResultsPanel {
    export type DeferredSearchData = {
        searchResults: BranchSearchResult[];
        branchLngLats: Array<[number, number]>;
    };

    export interface Props {
        heading?: string;
        searchResults?: BranchSearchResult[];
        branchLngLats?: Array<[number, number]>;
        deferredSearchData?: Promise<DeferredSearchData>;
        mapboxToken: string;
    }
}

function SearchResultsList({ searchResults }: { searchResults: BranchSearchResult[] }) {
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

function DeferredSearchResultsList({
    deferredSearchData,
}: {
    deferredSearchData: Promise<SearchResultsPanel.DeferredSearchData>;
}) {
    const { searchResults } = use(deferredSearchData);
    return <SearchResultsList searchResults={searchResults} />;
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
                if (!isCancelled) setBranchLngLats(data.branchLngLats);
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
        <div className="flex h-full items-start mt-4 justify-center">
            <Spinner className="h-8 w-8 " />
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

export function SearchResultsPanel({ mapboxToken, ...props }: SearchResultsPanel.Props) {
    const searchResults = props.searchResults ?? [];
    const branchLngLats = props.branchLngLats ?? [];
    const deferredSearchData = props.deferredSearchData;
    const heading = props.heading ?? "All Available Locations";

    return (
        <div className="flex flex-col gap-[0.5rem] overflow-hidden px-4 pb-4">
            <h4 className="font-bold pt-2">{heading}</h4>
            <div className="grid grid-cols-2 gap-[1rem] h-[45rem] pt-2">
                {deferredSearchData ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <SearchResultsList searchResults={searchResults} />
                        <BranchMap
                            className="h-full w-full"
                            branchLngLats={branchLngLats}
                            token={mapboxToken}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
