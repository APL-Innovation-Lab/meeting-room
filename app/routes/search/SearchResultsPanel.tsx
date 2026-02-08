import { Map as BranchMap } from "~/components/Map";
import { SearchResult } from "./SearchResult";
import { type BranchSearchResult } from "./search.data.server";

export namespace SearchResultsPanel {
    export interface Props {
        searchResults: BranchSearchResult[];
        branchLngLats: Array<[number, number]>;
        mapboxToken: string;
    }
}

export function SearchResultsPanel({
    searchResults,
    branchLngLats,
    mapboxToken,
}: SearchResultsPanel.Props) {
    return (
        <div className="grid h-[45rem] grid-cols-2 gap-[1rem] overflow-hidden p-4">
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
            <BranchMap
                className="h-full w-full"
                branchLngLats={branchLngLats}
                token={mapboxToken}
            />
        </div>
    );
}
