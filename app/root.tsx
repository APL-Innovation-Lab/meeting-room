import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { site } from "~/lib/site";

// import tailwind from "~/tailwind.css?url";
import uswdsReact from "@trussworks/react-uswds/lib/index.css?url";
import uswds from "@trussworks/react-uswds/lib/uswds.css?url";

export async function loader({ request }: LoaderFunctionArgs) {
    return json({ url: request.url });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
    { charSet: "utf-8" },
    { title: site.title },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "description", content: site.description },
    { name: "og:title", content: site.title },
    { name: "og:type", content: "website" },
    { name: "og:image", content: site.socialMediaImage.light },
    { name: "og:description", content: site.description },
    { name: "og:url", content: data!.url },
];

export const links: LinksFunction = () => [
    { rel: "icon", type: "image/svg+xml", href: site.favicon },
    // { rel: "stylesheet", href: tailwind },
    { rel: "stylesheet", href: uswds },
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
            <body className="bg-base-lightest padding-y-4 padding-x-15">
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}
