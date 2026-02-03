import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Map } from "~/components/Map";
import lngLat from "~/data/lng-lat.json";
import { site } from "~/lib/site";
import { RoomType } from "~/route-map";
import { Route } from "./+types/search";

export async function loader({ params }: Route.LoaderArgs) {
    const roomType = params.roomType as RoomType;

    return {
        roomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats: lngLat.map(branch => branch.lngLat as [number, number]),
    };
}

export default function FindARoom({ loaderData }: Route.ComponentProps) {
    const { roomType, accessToken: mapboxToken, branchLngLats } = loaderData;
    const isMeetingRoom = roomType === RoomType.MeetingRoom;

    return (
        <div className="flex justify-center max-h-viewport overflow-scroll">
            <title>{`Find a Room • ${site.title}`}</title>
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <div className="pl-5 pr-5">
                        <Breadcrumbs links={site.breadcrumbs.search(roomType)} />
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-sans-2xl usa-card__heading font-bold py-[0.25rem]">
                                Find a Room
                            </h1>
                            {isMeetingRoom && (
                                <h2 className="font-sans text-sans-sm">MEETING ROOM</h2>
                            )}
                            <p className="font-sans text-base-darker text-sans-xs pt-4">
                                {isMeetingRoom ? (
                                    <>
                                        <strong>
                                            Rooms for commercial work purposes are only available at
                                            capacities of 4, 8, and 10.{" "}
                                        </strong>
                                        Rooms can be booked in 15 min time blocks up to 2-hours, and
                                        up to 2 weeks out.
                                    </>
                                ) : (
                                    <>
                                        For smaller groups, please consider our Shared Learning
                                        Rooms with capacities of 4, 8, and 10. Groups up to 20+ to
                                        100 people are better for Meeting Rooms.
                                    </>
                                )}
                            </p>
                        </CardHeader>
                    </div>

                    <div className="grid grid-cols-2 px-10">
                        <div></div>
                        <Map branchLngLats={branchLngLats} token={mapboxToken} />
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
