import { pluralize } from "~/lib/pluralize";

export namespace SearchResult {
    export interface Props {
        index: number;
        branch: string;
        address: string;
        distance: string;
        roomsAvailable: number;
        image: string;
        url: string;
    }
}

export function SearchResult(props: SearchResult.Props) {
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
                    <h6 className="text-sans-3xs font-sans text-base-darker">
                        {props.distance} mi
                    </h6>
                </div>
                <span>{props.address}</span>
                <strong>
                    {props.roomsAvailable}{" "}
                    {pluralize(props.roomsAvailable, { one: "Room", other: "Rooms" })} Available
                </strong>
            </div>
        </li>
    );
}
