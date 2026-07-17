import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import type { SearchFilters } from "./search.data.server";

import { RoomSearchResult } from "./RoomSearchResult";

const filters: SearchFilters = {
    location: "Central Library",
    date: "2026-07-15",
    duration: "120",
    people: "4",
    display: true,
    hdmi: false,
    whiteboard: false,
};

const result = {
    roomId: "409",
    roomKind: "shared-learning-room" as const,
    name: "Shared Learning - 409",
    branch: "Central Library",
    floor: 4,
    capacity: 4,
    address: "710 W Cesar Chavez St, Austin, TX 78701",
    image: "https://library.austintexas.gov/library/slr-409.jpg",
    amenities: { airplay: true, hdmi: true, whiteboard: false },
    availableTimes: ["9:00 AM", "9:15 AM"],
    date: "2026-07-15",
};

describe("RoomSearchResult", () => {
    it("renders room metadata and time links that preserve the booking search", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <RoomSearchResult filters={filters} priority result={result} />
            </MemoryRouter>,
        );

        expect(markup).toContain('alt="Shared Learning - 409 at Central Library"');
        expect(markup).toContain("Capacity:</span> 4");
        expect(markup).toContain("Central Library, Floor 4");
        expect(markup).toContain("AirPlay");
        expect(markup).toContain("HDMI");
        expect(markup).not.toContain("Whiteboard");
        expect(markup).toContain('aria-label="Select 9:00 AM for Shared Learning - 409"');
        expect(markup).toContain(
            'href="/shared-learning-room/review?roomId=409&amp;location=Central+Library&amp;date=2026-07-15&amp;time=9%3A00+AM&amp;duration=120&amp;people=4&amp;display=on"',
        );
    });

    it("keeps the selected branch name in the review URL", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <RoomSearchResult
                    filters={{
                        ...filters,
                        location: "Carver Branch",
                        people: "",
                        display: false,
                    }}
                    result={{ ...result, branch: "George Washington Carver Branch" }}
                />
            </MemoryRouter>,
        );

        expect(markup).toContain("location=Carver+Branch");
        expect(markup).not.toContain("location=George+Washington+Carver+Branch");
    });
});
