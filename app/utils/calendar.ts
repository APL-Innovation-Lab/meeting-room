// generate .ics file
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

    const durationMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(durationMinutes / 60)
        .toString()
        .padStart(2, "0");
    const minutes = (durationMinutes % 60).toString().padStart(2, "0");
    const duration = `${hours}${minutes}`;

    const url = new URL("https://calendar.yahoo.com/");
    url.searchParams.set("v", "60");
    url.searchParams.set("title", title);
    url.searchParams.set("st", formatYahooDate(start));
    url.searchParams.set("dur", duration);
    url.searchParams.set("desc", description);
    url.searchParams.set("in_loc", location);

    return url.toString();
}
