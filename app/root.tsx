import uswdsReact from "@trussworks/react-uswds/lib/index.css?url";
import { Outlet, Scripts, ScrollRestoration, useRouteLoaderData } from "react-router";
import { site } from "~/lib/site";
import tailwind from "~/styles/tailwind.css?url";
import { Route } from "./+types/root";

export async function loader({ url }: Route.LoaderArgs) {
    return url.href;
}

export function Layout({ children }: { children: React.ReactNode }) {
    const url = useRouteLoaderData<Route.ComponentProps["loaderData"]>("root");

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <title>{site.title}</title>
                <meta name="og:title" content={site.title} />
                <meta name="description" content={site.description} />
                <meta name="og:description" content={site.description} />
                <meta name="og:type" content="website" />
                <meta name="og:image" content={site.socialMediaImage.light} />
                {url ? <meta name="og:url" content={url} /> : null}

                <link rel="icon" type="image/svg+xml" href={site.favicon} />
                <link rel="apple-touch-icon" href={site.homeScreenIcon} />
                <link rel="stylesheet" href={tailwind} />
                <link rel="stylesheet" href={uswdsReact} />
            </head>
            <body className="bg-base-lightest mx-auto my-2 max-w-[60rem]">
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
