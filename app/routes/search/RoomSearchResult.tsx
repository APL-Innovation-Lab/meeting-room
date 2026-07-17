import { Tag } from "@trussworks/react-uswds";
import { Link } from "react-router";

import {
    type RoomSearchResult as RoomSearchResultData,
    type SearchFilters,
} from "./search.data.server";

export namespace RoomSearchResult {
    export interface Props {
        filters: SearchFilters;
        priority?: boolean;
        result: RoomSearchResultData;
    }
}

const AMENITIES = [
    ["airplay", "AirPlay"],
    ["hdmi", "HDMI"],
    ["whiteboard", "Whiteboard"],
] as const;

export function RoomSearchResult({ filters, priority = false, result }: RoomSearchResult.Props) {
    const availableAmenities = AMENITIES.filter(([amenity]) => result.amenities[amenity]);
    const baseReviewParams = new URLSearchParams();
    baseReviewParams.set("roomId", result.roomId);
    baseReviewParams.set("location", filters.location);
    baseReviewParams.set("date", result.date);
    baseReviewParams.set("time", "");
    baseReviewParams.set("duration", filters.duration);
    if (filters.people) baseReviewParams.set("people", filters.people);
    if (filters.display) baseReviewParams.set("display", "on");
    if (filters.hdmi) baseReviewParams.set("hdmi", "on");
    if (filters.whiteboard) baseReviewParams.set("whiteboard", "on");

    return (
        <article className="flex flex-col gap-3 py-4 first:pt-3">
            <header className="flex flex-col gap-3 mobile-lg:flex-row">
                <img
                    className="aspect-[4/3] w-full object-cover mobile-lg:w-40 mobile-lg:shrink-0"
                    alt={`${result.name} at ${result.branch}`}
                    decoding="async"
                    fetchPriority={priority ? "high" : "low"}
                    height={120}
                    loading={priority ? "eager" : "lazy"}
                    src={result.image}
                    width={160}
                />
                <div className="min-w-0">
                    <h3 className="font-sans text-sans-md font-bold text-pretty">{result.name}</h3>
                    <p>
                        <span className="font-bold">Capacity:</span> {result.capacity}
                    </p>
                    <p className="text-base-darker">
                        {result.branch}
                        {result.floor === undefined ? null : `, Floor ${result.floor}`}
                    </p>
                    {availableAmenities.length > 0 ? (
                        <ul
                            className="mt-2 flex list-none flex-wrap gap-1 p-0"
                            aria-label={`Amenities in ${result.name}`}
                        >
                            {availableAmenities.map(([amenity, label]) => (
                                <li key={amenity}>
                                    <Tag className="bg-base-lighter text-ink normal-case">
                                        {label}
                                    </Tag>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </header>

            <div>
                <h4 className="sr-only">Available times for {result.name}</h4>
                <ul className="grid max-w-[35rem] list-none grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2 p-0">
                    {result.availableTimes.map(time => {
                        const reviewParams = new URLSearchParams(baseReviewParams);
                        reviewParams.set("time", time);
                        return (
                            <li key={time}>
                                <Link
                                    className="m-0 inline-flex min-h-12 w-full items-center justify-center bg-transparent px-2 text-center no-underline usa-button usa-button--outline"
                                    prefetch="intent"
                                    to={`/${result.roomKind}/review?${reviewParams}`}
                                    aria-label={`Select ${time} for ${result.name}`}
                                >
                                    {time}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </article>
    );
}
