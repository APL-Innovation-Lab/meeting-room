import { BreadcrumbItem } from "~/components/Breadcrumbs";
import { displayName, RoomType, routes } from "~/route-map";

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
        ] satisfies BreadcrumbItem[],
        search: (roomType: RoomType) =>
            [
                ...site.breadcrumbs.home,
                {
                    href: routes.search.href({ roomType }),
                    text: displayName(roomType),
                },
            ] satisfies BreadcrumbItem[],
    },
};
