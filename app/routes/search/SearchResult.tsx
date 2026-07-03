import clsx from "clsx";
import { href, Link } from "react-router";

import { pluralize } from "~/lib/pluralize";
import { Room } from "~/lib/room";

export namespace SearchResult {
    export interface Props {
        index: number;
        roomKind: Room.Kind;
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
        <li className="flex w-full gap-[1rem] [&:not(:first-child)]:pt-2">
            <img className="h-[100px] w-[100px] object-cover" src={props.image} />
            <div className="flex w-full flex-col gap-[0.5rem]">
                <div className="flex w-full items-center justify-between">
                    <a
                        className="usa-link font-bold no-underline"
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
                            "text-base-darker font-sans text-sans-3xs",
                            shouldShowDistance && "hidden",
                        )}
                    >
                        {props.distance} mi
                    </h6>
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
                    <Link
                        className="usa-button usa-button--outline margin-0 whitespace-nowrap"
                        to={href("/:roomKind/review", { roomKind: props.roomKind })}
                    >
                        Reserve
                    </Link>
                </div>
            </div>
        </li>
    );
}
