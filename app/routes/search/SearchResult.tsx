import clsx from "clsx";

import { pluralize } from "~/lib/pluralize";

export namespace SearchResult {
    export interface Props {
        index: number;
        branch: string;
        address: string;
        distance: string;
        roomsAvailable: number;
        maxAvailableDuration?: number;
        image: string;
        url: string;
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
    const shouldShowDistance = false;

    return (
        <li className="flex gap-[1rem] w-full [&:not(:first-child)]:pt-2">
            <img className="object-cover w-[100px] h-[100px]" src={props.image} />
            <div className="flex flex-col gap-[0.5rem] w-full">
                <div className="flex justify-between items-center w-full">
                    <a
                        className="usa-link no-underline font-bold"
                        href={props.url}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <h4>
                            {props.index}. {props.branch}
                        </h4>
                    </a>
                    <h6
                        className={clsx(
                            "text-sans-3xs font-sans text-base-darker",
                            shouldShowDistance && "hidden",
                        )}
                    >
                        {props.distance} mi
                    </h6>
                </div>
                <span>{props.address}</span>
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
        </li>
    );
}
