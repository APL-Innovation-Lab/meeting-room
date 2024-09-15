import { Link } from "@remix-run/react";
import { Breadcrumb, BreadcrumbBar, BreadcrumbLink } from "@trussworks/react-uswds";
import React from "react";

interface BreadcrumbItem {
    href: string;
    text: string;
}

interface BreadcrumbsProps {
    links: BreadcrumbItem[];
}

function RemixLink({ href, ...props }: any) {
    // eslint-disable-next-line
    return <Link {...props} to={href} />;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links }) => {
    return (
        <>
            <BreadcrumbBar className="ml-2">
                {links.map(item => (
                    <Breadcrumb className="relative left-0" key={item.href}>
                        <BreadcrumbLink asCustom={RemixLink} href={item.href}>
                            <span className="!no-underline">{item.text}</span>
                        </BreadcrumbLink>
                    </Breadcrumb>
                ))}
            </BreadcrumbBar>
        </>
    );
};

export default Breadcrumbs;
