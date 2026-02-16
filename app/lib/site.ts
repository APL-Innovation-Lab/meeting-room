import type { Breadcrumbs } from "~/components/Breadcrumbs";
import { Room, routes } from "~/route-map";

export const site = {
    title: "APL Prototype",
    description: "",
    favicon: "https://library.austintexas.gov/favicon.ico",
    homeScreenIcon: "https://library.austintexas.gov/apple-touch-icon-180x180.png",
    socialMediaImage: {
        dark: "",
        light: "",
    },
    breadcrumbs: {
        home: [
            { href: "https://library.austintexas.gov", text: "Home" },
            { href: routes.home.href(), text: "Meeting Spaces" },
        ] satisfies Breadcrumbs.Item[],
        search: (room: Room) =>
            [
                ...site.breadcrumbs.home,
                {
                    href: routes.search.href({ roomKind: room.kind }),
                    text: room.displayName,
                },
            ] satisfies Breadcrumbs.Item[],
    },
};
