import { Card, CardGroup, CardHeader, Label, Select } from "@trussworks/react-uswds";
import { Form, Link, LinkProps } from "react-router";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Map } from "~/components/Map";
import lngLat from "~/data/lng-lat.json";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";

export async function loader({ params }: Route.LoaderArgs) {
    return {
        branches: lngLat.map(location => location.branch),
        roomType: params.roomType as RoomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats: lngLat.map(branch => branch.lngLat as [number, number]),
    };
}

function ExternalLink({ children, className, ...props }: LinkProps) {
    return (
        <Link className={`usa-link usa-link--external ${className}`} {...props}>
            {children}
        </Link>
    );
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const { branches, roomType, accessToken: mapboxToken, branchLngLats } = loaderData;
    const isMeetingRoom = roomType === RoomType.MeetingRoom;
    const title = displayName(roomType);

    return (
        <>
            <title>{`${title} • ${site.title}`}</title>
            <CardGroup>
                <Card>
                    <div className="px-5">
                        <Breadcrumbs className="pb-0" links={site.breadcrumbs.search(roomType)} />
                        <CardHeader className="flex flex-col gap-[0.75rem]">
                            <h1 className="font-sans text-sans-2xl usa-card__heading font-bold">
                                {title}
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs">
                                {isMeetingRoom ? (
                                    <>
                                        For larger groups. Request 15 min time slots up to 15 hrs.
                                        Can reserve up to 90 days out.{" "}
                                        <ExternalLink to="">View Booked Calendar</ExternalLink>
                                        <br />
                                        <br />
                                        <strong className="mr-2">Reserve In-Person Instead</strong>
                                        <ExternalLink className="mr-1" to="">
                                            Printable Form (PDF)
                                        </ExternalLink>
                                        |
                                        <ExternalLink className="ml-1" to="">
                                            Sala de reunión forma de solicitud
                                        </ExternalLink>
                                    </>
                                ) : (
                                    <>
                                        For smaller groups. Rooms can be booked up to 2 weeks and
                                        not less than 2 hours in advance. Book from 15 min up to 2
                                        hrs maximum.{" "}
                                        <ExternalLink to="">View Booked Calendar</ExternalLink>
                                    </>
                                )}
                            </p>
                        </CardHeader>

                        <Form className="px-3">
                            <Label htmlFor="location">Location</Label>
                            <Select className="w-full max-w-none" id="location" name="location">
                                <option value="all">All Available Locations</option>
                                {branches.map(branch => (
                                    <option value={branch}>{branch}</option>
                                ))}
                            </Select>
                        </Form>

                        <div className="grid grid-cols-2 gap-4 p-4">
                            <div className="h-[30rem]" />
                            <Map
                                className="w-full h-full"
                                branchLngLats={branchLngLats}
                                token={mapboxToken}
                            />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </>
    );
}
