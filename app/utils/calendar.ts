/**
 * Generates an .ics file for Outlook and Apple calendar formats.
 * @param {string} title - The specific library branch.
 * @param {string} description - The type of reservation and at what library branch.
 * @param {string} location - The address of the library branch.
 * @param {Date} start - Start time; expects a Date constructor, such as: new Date("2024-03-04T11:00:00-06:00")
 * @param {Date} end - End time; expects a Date constructor, such as: new Date("2024-03-04T13:00:00-06:00")
 * @returns
 */
export function generateICS({
    title,
    description,
    location,
    start,
    end,
}: {
    title: string;
    description: string;
    location: string;
    start: Date;
    end: Date;
}) {
    // regex to capture default output from Date and format it for .ics, GCal, etc. This
    // is a standardized date format for all calendar export files
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d\d\d/g, "");

    // all .ics files must adhere to this format, based on RFC 5545
    return `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
END:VEVENT
END:VCALENDAR`.trim();
}

/**
 * Generates a link containing the .ics file
 * @param {string} baseUrl - URL containing the .ics file.
 * @param {string} title - The specific library branch.
 * @param {string} description - The type of reservation and at what library branch.
 * @param {string} location - The address of the library branch.
 * @param {Date} start - Start time; expects a Date constructor, such as: new Date("2024-03-04T11:00:00-06:00")
 * @param {Date} end - End time; expects a Date constructor, such as: new Date("2024-03-04T13:00:00-06:00")
 */
export function getICSDownloadUrl({
    baseUrl,
    title,
    description,
    location,
    start,
    end,
}: {
    baseUrl: string;
    title: string;
    description: string;
    location: string;
    start: Date;
    end: Date;
}) {
    // url fallback for dev testing
    const fallbackBase = baseUrl || "http://localhost:5173";
    const url = new URL("/calendar.ics", fallbackBase);

    url.searchParams.set("title", title);
    url.searchParams.set("description", description);
    url.searchParams.set("location", location);
    url.searchParams.set("start", start.toISOString());
    url.searchParams.set("end", end.toISOString());

    return url.toString();
}

/**
 * Generates a Google Calendar URL
 * @param {string} title - The specific library branch.
 * @param {string} description - The type of reservation and at what library branch.
 * @param {string} location - The address of the library branch.
 * @param {Date} start - Start time; expects a Date constructor, such as: new Date("2024-03-04T11:00:00-06:00")
 * @param {Date} end - End time; expects a Date constructor, such as: new Date("2024-03-04T13:00:00-06:00")
 */
export function getGoogleCalendarUrl({
    title,
    description,
    location,
    start,
    end,
}: {
    title: string;
    description: string;
    location: string;
    start: Date;
    end: Date;
}) {
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d\d\d/g, "");

    // Google's specific parameters
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", title);
    url.searchParams.set("details", description);
    url.searchParams.set("location", location);
    url.searchParams.set("dates", `${formatDate(start)}/${formatDate(end)}`);

    return url.toString();
}

/**
 * Generates a Yahoo! Calendar URL
 * @param {string} title - The specific library branch.
 * @param {string} description - The type of reservation and at what library branch.
 * @param {string} location - The address of the library branch.
 * @param {Date} start - Start time; expects a Date constructor, such as: new Date("2024-03-04T11:00:00-06:00")
 * @param {Date} end - End time; expects a Date constructor, such as: new Date("2024-03-04T13:00:00-06:00")
 */
export function getYahooCalendarUrl({
    title,
    description,
    location,
    start,
    end,
}: {
    title: string;
    description: string;
    location: string;
    start: Date;
    end: Date;
}) {
    const formatYahooDate = (date: Date) =>
        date
            .toISOString()
            .replace(/[-:]|\.\d\d\d/g, "")
            .slice(0, 15);

    // unlike .ics and Google, Yahoo doesn't take an end time, only start and duration
    const durationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    // converts total minutes into HHMM format
    const hours = Math.floor(durationMinutes / 60)
        .toString()
        .padStart(2, "0");
    const minutes = (durationMinutes % 60).toString().padStart(2, "0");

    // Yahoo's format for duration, basically an end time
    const duration = `${hours}${minutes}`;

    // Yahoo's specific params
    const url = new URL("https://calendar.yahoo.com/");
    url.searchParams.set("v", "60");
    url.searchParams.set("title", title);
    url.searchParams.set("st", formatYahooDate(start));
    url.searchParams.set("dur", duration);
    url.searchParams.set("desc", description);
    url.searchParams.set("in_loc", location);

    return url.toString();
}
