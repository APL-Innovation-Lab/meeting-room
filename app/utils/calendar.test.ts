import { describe, expect, it } from "vitest";

import { generateICS } from "./calendar";

const baseEvent = {
    title: "Austin Central Library, #3",
    description: "Shared room reservation",
    location: "710 W Cesar Chavez St, Austin, TX 78702",
    start: new Date("2024-03-04T11:00:00Z"),
    end: new Date("2024-03-04T11:15:00Z"),
};

describe("generateICS — BK-2 produces a valid VCALENDAR/VEVENT payload", () => {
    it("wraps a single event with the required calendar + event fields", () => {
        const ics = generateICS(baseEvent);
        const lines = ics.split("\r\n");
        expect(lines[0]).toBe("BEGIN:VCALENDAR");
        expect(lines.at(-1)).toBe("END:VCALENDAR");
        expect(ics).toContain("VERSION:2.0");
        expect(ics).toContain("PRODID:");
        expect(ics).toContain("UID:");
        expect(ics).toContain("DTSTAMP:");
        expect(ics).toContain("DTSTART:20240304T110000Z");
        expect(ics).toContain("DTEND:20240304T111500Z");
        // Exactly one event — no accidental duplication.
        expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
        expect(ics.match(/END:VEVENT/g)).toHaveLength(1);
    });

    it("uses CRLF line breaks", () => {
        expect(generateICS(baseEvent)).toContain("\r\n");
    });
});

describe("generateICS — SEC-1 escapes RFC-5545 TEXT so fields can't inject structure", () => {
    it("escapes a newline-based VEVENT-forgery attempt in the title", () => {
        const ics = generateICS({
            ...baseEvent,
            title: "Pwned\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Injected",
        });
        // The injected control lines must be neutralized to a single escaped SUMMARY value...
        expect(ics).toContain("SUMMARY:Pwned\\nEND:VEVENT\\nBEGIN:VEVENT\\nSUMMARY:Injected");
        // ...so the document still contains exactly one real event.
        expect(ics.match(/(^|\r\n)BEGIN:VEVENT/g)).toHaveLength(1);
        expect(ics.match(/(^|\r\n)END:VEVENT/g)).toHaveLength(1);
    });

    it("escapes commas, semicolons, and backslashes", () => {
        const ics = generateICS({ ...baseEvent, location: "A; B, C \\ D" });
        expect(ics).toContain("LOCATION:A\\; B\\, C \\\\ D");
    });
});
