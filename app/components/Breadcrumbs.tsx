import { Breadcrumb, BreadcrumbBar, BreadcrumbLink } from "@trussworks/react-uswds";
import React from "react";

interface BreadcrumbItem {
    href: string;
    text: string;
}

interface BreadcrumbsProps {
    links: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links }) => {
    return (
        <>
            <BreadcrumbBar className="ml-2">
                {links.map((item, index) => (
                    <Breadcrumb className="relative left-0" key={index}>
                        <BreadcrumbLink href={item.href}>
                            <span>{item.text}</span>
                        </BreadcrumbLink>
                    </Breadcrumb>
                ))}
            </BreadcrumbBar>
        </>
    );
};

export default Breadcrumbs;
