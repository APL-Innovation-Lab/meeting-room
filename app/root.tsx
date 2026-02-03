import type { LinksFunction } from "react-router";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { site } from "~/lib/site";

import uswdsReact from "@trussworks/react-uswds/lib/index.css?url";
import tailwind from "~/styles/tailwind.css?url";
import { Route } from "./+types/root";

export async function loader({ request }: Route.LoaderArgs) {
    return { url: request.url };
}

export const meta: Route.MetaFunction = ({ data }) => [
    { charSet: "utf-8" },
    { title: site.title },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: site.description },
    { name: "og:title", content: site.title },
    { name: "og:type", content: "website" },
    { name: "og:image", content: site.socialMediaImage.light },
    { name: "og:description", content: site.description },
    { name: "og:url", content: data.url },
];

export const links: LinksFunction = () => [
    { rel: "icon", type: "image/svg+xml", href: site.favicon },
    { rel: "apple-touch-icon", href: site.homeScreenIcon },
    { rel: "stylesheet", href: tailwind },
    { rel: "stylesheet", href: uswdsReact },
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta content="width=device-width, initial-scale=1" name="viewport" />
                <Meta />
                <Links />
            </head>
            <body className="bg-base-lightest py-4 px-15">
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function Component() {
    return <Outlet />;
}
