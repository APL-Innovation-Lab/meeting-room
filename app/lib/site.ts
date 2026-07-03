import { href } from "react-router";

import type { Breadcrumbs } from "~/components/Breadcrumbs";
import type { Room } from "~/lib/room";

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
            { href: href("/"), text: "Meeting Spaces" },
        ] satisfies Breadcrumbs.Item[],
        search: (room: Room) =>
            [
                ...site.breadcrumbs.home,
                {
                    href: href("/:roomKind", { roomKind: room.kind }),
                    text: room.displayName,
                },
            ] satisfies Breadcrumbs.Item[],
    },
};
