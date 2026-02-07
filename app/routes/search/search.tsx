import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { apl } from "~/lib/apl-client/apl-live-client.server";
import { site } from "~/lib/site";
import { displayName, RoomType } from "~/route-map";
import { Route } from "./+types/search";
import { SearchDescription } from "./SearchDescription";
import { SearchFiltersForm } from "./SearchFiltersForm";
import { SearchResultsPanel } from "./SearchResultsPanel";
import {
    createBranchLngLats,
    createLocationOptions,
    createSearchResults,
} from "./search.data.server";

const dateFormatter = new Intl.DateTimeFormat("en-CA");

export async function loader({ params }: Route.LoaderArgs) {
    const roomType = params.roomType as RoomType;

    const [
        meetingOrSharedResult,
        branchDirectoryResult,
        branchCoordinatesResult,
        locationPathResult,
    ] = await Promise.all([
        roomType === RoomType.MeetingRoom
            ? apl.getMeetingRoomBranches()
            : apl.getSharedLearningRoomBranches(),
        apl.getBranchDirectory(),
        apl.getBranchCoordinates(),
        apl.getLocationPathMapping(),
    ]);

    const locationBranches = !meetingOrSharedResult.error ? meetingOrSharedResult.data : [];
    const branchDirectory = !branchDirectoryResult.error ? branchDirectoryResult.data : [];
    const liveBranchCoordinates = !branchCoordinatesResult.error
        ? branchCoordinatesResult.data
        : [];
    const locationPathMapping = !locationPathResult.error ? locationPathResult.data : {};

    const searchResults = createSearchResults(
        locationBranches,
        branchDirectory,
        locationPathMapping,
    );

    return {
        searchResults,
        currentDate: dateFormatter.format(new Date()),
        locationOptions: createLocationOptions(searchResults),
        roomType,
        accessToken: import.meta.env.VITE_APP_MAPBOX_TOKEN,
        branchLngLats: createBranchLngLats(searchResults, liveBranchCoordinates),
    };
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const {
        searchResults,
        currentDate,
        locationOptions,
        roomType,
        accessToken: mapboxToken,
        branchLngLats,
    } = loaderData;
    const title = displayName(roomType);

    return (
        <>
            <title>{`${title} • ${site.title}`}</title>
            <CardGroup>
                <Card>
                    <div className="px-5">
                        <Breadcrumbs className="pb-0" links={site.breadcrumbs.search(roomType)} />
                        <CardHeader className="flex flex-col gap-[0.75rem]">
                            <h1 className="usa-card__heading font-sans text-sans-2xl font-bold">
                                {title}
                            </h1>
                            <p className="font-sans text-sans-xs text-base-darker">
                                <SearchDescription roomType={roomType} />
                            </p>
                        </CardHeader>

                        <SearchFiltersForm
                            currentDate={currentDate}
                            locationOptions={locationOptions}
                        />
                        <SearchResultsPanel
                            searchResults={searchResults}
                            branchLngLats={branchLngLats}
                            mapboxToken={mapboxToken}
                        />
                    </div>
                </Card>
            </CardGroup>
        </>
    );
}
