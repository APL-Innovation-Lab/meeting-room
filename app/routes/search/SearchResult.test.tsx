import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SearchResult } from "./SearchResult";

describe("SearchResult", () => {
    it("opens the branch room results inside the current search flow", () => {
        const markup = renderToStaticMarkup(
            <MemoryRouter>
                <SearchResult
                    address="710 W Cesar Chavez St, Austin, TX 78701"
                    branch="Central Library"
                    distance="0.0"
                    image="https://library.austintexas.gov/library/central.jpg"
                    index={1}
                    roomsAvailable={2}
                    searchUrl="/shared-learning-room?location=Central+Library&date=2026-07-15"
                />
            </MemoryRouter>,
        );

        expect(markup).toContain(
            'href="/shared-learning-room?location=Central+Library&amp;date=2026-07-15"',
        );
        expect(markup).not.toContain('target="_blank"');
        expect(markup).toContain("1. Central Library");
        expect(markup).toContain('<h4 aria-level="3">1. Central Library</h4>');
        expect(markup).not.toContain("<h6");
    });
});
