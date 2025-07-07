import { LoaderFunctionArgs } from "react-router";
import { generateICS } from "~/utils/calendar";

/*
////// Test Email Export\

http://localhost:3000/calendar.ics?title=Demo%20Event&description=This%20is%20a%20test%20event&location=Online&start=2025-06-01T10:00:00Z&end=2025-06-01T11:00:00Z


*/

// create calendar template for reservation
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const title = url.searchParams.get("title") ?? "Event"; //'Event' used as fallback in case 'title' isn't supplied for SUMMARY
    const description = url.searchParams.get("description") ?? "";
    const location = url.searchParams.get("location") ?? "";
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    //handle error for no date supplied
    if (!start || !end) {
        return new Response("Missing `start` or `end` date.", { status: 400 });
    }

    // .ics file generation
    const icsContent = generateICS({
        title,
        description,
        location,
        start: new Date(start),
        end: new Date(end),
    });

    // headers for API call
    return new Response(icsContent, {
        headers: {
            "Content-Type": "text/calendar",
            "Content-Disposition": "attachment; filename=event.ics",
        },
    });
}
