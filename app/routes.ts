import { index, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
    index("./routes/home/home.tsx"),
    route("calendar.ics", "./routes/calendar-ics.ts"),
    ...prefix(":roomKind", [
        index("./routes/search/search.tsx"),
        route("review", "./routes/review/review.tsx"),
        route("confirm", "./routes/confirm/confirm.tsx"),
        ...prefix("cancel", [
            index("./routes/cancel/cancel.tsx"),
            route("confirm", "./routes/cancel/confirm.tsx"),
        ]),
    ]),
] satisfies RouteConfig;
