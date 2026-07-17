import { PropsWithChildren } from "react";
import { href, Link } from "react-router";

import { Room } from "~/lib/room.ts";

export namespace RoomSelector {
    export function Card({ kind }: { kind: Room.Kind }) {
        return (
            <div className="flex flex-col gap-[1.5rem] rounded-[0.25rem] border border-apl-green p-2">
                <div className="flex flex-col gap-[1.25rem]">
                    <h4 className="text-sans-xs font-bold text-apl-green">
                        {kind === "shared-learning-room"
                            ? "Shared Learning/Study Rooms"
                            : "Meeting Rooms"}
                    </h4>

                    <h3 className="text-sans-lg font-bold">
                        {kind === "shared-learning-room" ? "Small Groups" : "Large Groups"}
                    </h3>
                </div>

                <ul className="h-full list-disc pl-3">
                    {kind === "shared-learning-room" ? (
                        <>
                            <li>1-12 People</li>
                            <li>Available to any person or group.</li>
                        </>
                    ) : (
                        <>
                            <li>12+ People (minimum 3)</li>
                            <li>Non-commercial groups.</li>
                            <li>Must be free and open to public.</li>
                        </>
                    )}
                </ul>

                <Link className="m-0 usa-button" to={href("/:roomKind", { roomKind: kind })}>
                    {kind === "shared-learning-room" ? "Reserve" : "Request"}
                </Link>
            </div>
        );
    }

    export function Group({ children }: PropsWithChildren) {
        return <div className="grid grid-cols-2 items-stretch gap-[1.5rem]">{children}</div>;
    }
}
