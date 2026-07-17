import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SearchResultsPanel } from "./SearchResultsPanel";

const unresolvedSearchData = new Promise<SearchResultsPanel.DeferredSearchData>(() => undefined);

const searchFilters = {
    location: "Central Library",
    date: "2026-07-15",
    duration: "120",
    people: "",
    display: false,
    hdmi: false,
    whiteboard: false,
};

const roomResult = {
    roomId: "409",
    roomKind: "shared-learning-room" as const,
    name: "Shared Learning - 409",
    branch: "Central Library",
    floor: 4,
    capacity: 4,
    address: "710 W Cesar Chavez St, Austin, TX 78701",
    image: "https://library.austintexas.gov/library/slr-409.jpg",
    amenities: { airplay: true, hdmi: true, whiteboard: true },
    availableTimes: ["9:00 AM"],
    date: "2026-07-15",
};

const branchResult = {
    locationId: "3939",
    branch: "Central Library",
    capacities: [4, 8],
    address: "710 W Cesar Chavez St, Austin, TX 78701",
    distance: "0.0",
    roomsAvailable: 2,
    maxAvailableDuration: 120,
    image: "https://library.austintexas.gov/library/central.jpg",
    searchUrl: "/shared-learning-room?location=Central+Library",
};

describe("SearchResultsPanel", () => {
    it("preserves the list spinner while deferred results are loading", () => {
        const markup = renderToStaticMarkup(
            <SearchResultsPanel
                deferredSearchData={unresolvedSearchData}
                mapboxToken="test-token"
                searchFilters={searchFilters}
            />,
        );

        expect(markup).toContain("animate-spin");
        expect(markup).not.toContain("Map loading…");
    });

    it("preserves the established branch results layout", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <SearchResultsPanel
                    heading="All Available Locations"
                    mapboxToken="test-token"
                    searchData={{
                        mode: "branches",
                        searchResults: [branchResult],
                        branchLngLats: [],
                    }}
                    searchFilters={{ ...searchFilters, location: "all" }}
                />
            </MemoryRouter>,
        );

        expect(markup).toContain('class="flex flex-col gap-[0.5rem] overflow-hidden px-4 pb-4"');
        expect(markup).toContain(
            '<h4 class="pt-2 font-bold" aria-level="2">All Available Locations</h4>',
        );
        expect(markup).toContain('class="grid h-[45rem] grid-cols-2 gap-[1rem] pt-2"');
    });

    it("replaces branch summaries and the map with full-width room results", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <SearchResultsPanel
                    mapboxToken="test-token"
                    searchData={{
                        mode: "rooms",
                        branch: "Central Library",
                        roomResults: [roomResult],
                        suggestedAlternativeDays: [],
                    }}
                    searchFilters={searchFilters}
                />
            </MemoryRouter>,
        );

        expect(markup).toContain(">Results for Central Library</h2>");
        expect(markup).toContain("Shared Learning - 409");
        expect(markup).toContain('aria-label="Select 9:00 AM for Shared Learning - 409"');
        expect(markup).not.toContain("Map loading…");
    });

    it("shows the Figma empty state with four actionable alternative days", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter initialEntries={["/shared-learning-room"]}>
                <SearchResultsPanel
                    mapboxToken="test-token"
                    searchData={{
                        mode: "rooms",
                        branch: "Central Library",
                        roomResults: [],
                        suggestedAlternativeDays: [
                            {
                                date: "2026-07-20",
                                label: "Mon Jul 20",
                                searchUrl: "?location=Central+Library&date=2026-07-20&duration=120",
                            },
                            {
                                date: "2026-07-21",
                                label: "Tue Jul 21",
                                searchUrl: "?location=Central+Library&date=2026-07-21&duration=120",
                            },
                            {
                                date: "2026-07-22",
                                label: "Wed Jul 22",
                                searchUrl: "?location=Central+Library&date=2026-07-22&duration=120",
                            },
                            {
                                date: "2026-07-23",
                                label: "Thu Jul 23",
                                searchUrl: "?location=Central+Library&date=2026-07-23&duration=120",
                            },
                        ],
                    }}
                    searchFilters={searchFilters}
                />
            </MemoryRouter>,
        );

        expect(markup).toContain("Results for Central Library");
        expect(markup).toContain("None Available");
        expect(markup).toContain(
            "There are no rooms available that match your preference. Please consider a different date, or adjust the filters for alternatives.",
        );
        expect(markup).toContain("Suggested Alternative Days");
        expect(markup).toContain("Mon Jul 20");
        expect(markup).toContain(
            'href="/shared-learning-room?location=Central+Library&amp;date=2026-07-20&amp;duration=120"',
        );
        expect(markup.match(/usa-button--outline/g)).toHaveLength(4);
    });
});
