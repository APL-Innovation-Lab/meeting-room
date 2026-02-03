import { Breadcrumb, BreadcrumbBar, BreadcrumbLink } from "@trussworks/react-uswds";
import { ComponentProps } from "react";
import { Link as ReactRouterLink } from "react-router";

export interface BreadcrumbItem {
    href: string;
    text: string;
}

export interface BreadcrumbsProps {
    links: BreadcrumbItem[];
}

function Link({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
    return <ReactRouterLink {...props} to={href} />;
}

export function Breadcrumbs({ links }: BreadcrumbsProps) {
    return (
        <>
            <BreadcrumbBar className="ml-2">
                {links.map(item => (
                    <Breadcrumb className="relative left-0" key={item.href}>
                        <BreadcrumbLink asCustom={Link} href={item.href}>
                            <span className="!no-underline">{item.text}</span>
                        </BreadcrumbLink>
                    </Breadcrumb>
                ))}
            </BreadcrumbBar>
        </>
    );
}
