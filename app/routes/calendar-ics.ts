import { generateICS } from "~/utils/calendar";

import type { Route } from "./+types/calendar-ics";

/**
 * Resource route backing the "Outlook"/"iCal" download buttons. `getICSDownloadUrl` points those
 * links at `/calendar.ics?...`; previously no such route existed, so SSR served the app's HTML shell
 * and the browser saved that as `reservation.ics` (BK-2). This loader builds a real `text/calendar`
 * payload via `generateICS` (which RFC-5545-escapes the title/description/location, SEC-1).
 */
export function loader({ request }: Route.LoaderArgs) {
    const params = new URL(request.url).searchParams;

    const startRaw = params.get("start");
    const endRaw = params.get("end");
    const start = startRaw ? new Date(startRaw) : undefined;
    const end = endRaw ? new Date(endRaw) : undefined;

    if (!start || !end || Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
        return new Response("Invalid or missing start/end", { status: 400 });
    }

    const ics = generateICS({
        title: params.get("title") ?? "",
        description: params.get("description") ?? "",
        location: params.get("location") ?? "",
        start,
        end,
    });

    return new Response(ics, {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="reservation.ics"',
            "Cache-Control": "no-store",
        },
    });
}
