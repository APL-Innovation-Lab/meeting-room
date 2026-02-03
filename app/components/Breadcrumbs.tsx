import { Breadcrumb, BreadcrumbBar, BreadcrumbLink } from "@trussworks/react-uswds";
import { ComponentProps } from "react";
import { Link as ReactRouterLink } from "react-router";

function Link({ href, ...props }: Omit<ComponentProps<"a">, "href"> & { href: string }) {
    return <ReactRouterLink {...props} to={href} />;
}

export namespace Breadcrumbs {
    export interface Item {
        href: string;
        text: string;
    }

    export interface Props {
        links: Breadcrumbs.Item[];
    }
}

export function Breadcrumbs({ links }: Breadcrumbs.Props) {
    return (
        <>
            <BreadcrumbBar className="ml-2">
                {links.map((item, idx) => {
                    const isCurrent = idx === links.length - 1;
                    return (
                        <Breadcrumb className="relative left-0" key={item.href} current={isCurrent}>
                            {isCurrent ? (
                                item.text
                            ) : (
                                <BreadcrumbLink asCustom={Link} href={item.href}>
                                    {item.text}
                                </BreadcrumbLink>
                            )}
                        </Breadcrumb>
                    );
                })}
            </BreadcrumbBar>
        </>
    );
}
