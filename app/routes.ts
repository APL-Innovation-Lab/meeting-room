import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
    index("./routes/home.tsx"),
    route(":roomKind", "./routes/search/search.tsx"),
    route(":roomKind/review", "./routes/review.tsx"),
    route(":roomKind/confirm", "./routes/confirm.tsx"),
    route(":roomKind/cancel", "./routes/cancel/cancel.tsx"),
    route(":roomKind/cancel/confirm", "./routes/cancel/confirm.tsx"),
] satisfies RouteConfig;
