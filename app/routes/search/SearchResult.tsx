import { Link } from "react-router";

import { pluralize } from "~/lib/pluralize";

export namespace SearchResult {
    export interface Props {
        index: number;
        branch: string;
        address: string;
        distanceInMiles?: number;
        roomsAvailable: number;
        maxAvailableDuration?: number;
        image: string;
        searchUrl: string;
    }
}

function formatDurationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours <= 0) return `${mins} min`;
    if (mins <= 0) return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ${mins} min`;
}

export function SearchResult(props: SearchResult.Props) {
    return (
        <li className="flex w-full gap-[1rem] not-last:pb-2">
            <img
                className="size-25 object-cover"
                alt={`${props.branch} branch`}
                height={100}
                src={props.image}
                width={100}
            />
            <div className="flex w-full flex-col gap-[0.5rem]">
                <div className="flex w-full items-center justify-between">
                    <Link
                        className="font-bold no-underline usa-link"
                        prefetch="intent"
                        preventScrollReset
                        to={props.searchUrl}
                    >
                        <h4 aria-level={3}>
                            {props.index}. {props.branch}
                        </h4>
                    </Link>
                    {props.distanceInMiles === undefined ? null : (
                        <span className="font-sans text-sans-3xs text-base-darker">
                            {props.distanceInMiles.toFixed(1)} mi
                        </span>
                    )}
                </div>
                <span>{props.address}</span>
                <div className="flex w-full items-center justify-between gap-[1rem]">
                    <strong>
                        {props.roomsAvailable}{" "}
                        {pluralize(props.roomsAvailable, { one: "Room", other: "Rooms" })} Available
                        {props.maxAvailableDuration ? (
                            <span className="font-normal">
                                {" "}
                                (up to {formatDurationLabel(props.maxAvailableDuration)})
                            </span>
                        ) : null}
                    </strong>
                </div>
            </div>
        </li>
    );
}
