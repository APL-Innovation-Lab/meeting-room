import { CardGroup } from "@trussworks/react-uswds";
import React from "react";

interface BranchCardItem {
    href: string;
    text: string;
}

interface BranchCardProps {
    title: string;
    address: string;
    availability: string;
    links: BranchCardItem[];
}

const BranchCards: React.FC<BranchCardProps> = ({}) => {
    return (
        <>
            <CardGroup></CardGroup>
        </>
    );
};
