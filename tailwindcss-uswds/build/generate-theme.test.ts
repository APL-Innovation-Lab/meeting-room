import { describe, expect, it } from "vitest";

import theme from "../tokens/theme.json";

describe("generated Tailwind theme", () => {
    it("resolves USWDS gap tokens to valid CSS lengths", () => {
        expect(theme.gap.standard).toEqual({
            0: "0",
            1: "0.5rem",
            2: "1rem",
            3: "1.5rem",
            4: "2rem",
            5: "2.5rem",
            6: "3rem",
            "2px": "2px",
            "05": "0.25rem",
            sm: "2px",
            md: "1rem",
            lg: "1.5rem",
        });
    });
});
