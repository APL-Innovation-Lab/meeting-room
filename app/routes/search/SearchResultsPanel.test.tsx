import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchResultsPanel } from "./SearchResultsPanel";

const unresolvedSearchData = new Promise<SearchResultsPanel.DeferredSearchData>(() => undefined);

describe("SearchResultsPanel", () => {
    it("preserves the list spinner while deferred results are loading", () => {
        const markup = renderToStaticMarkup(
            <SearchResultsPanel
                deferredSearchData={unresolvedSearchData}
                mapboxToken="test-token"
                roomKind="meeting-room"
            />,
        );

        expect(markup).toContain("animate-spin");
        expect(markup).not.toContain("Map loading…");
    });
});
