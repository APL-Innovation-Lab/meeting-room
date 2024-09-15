import { CardGroup } from "@trussworks/react-uswds";
import React from "react";
import { BranchCard } from "./BranchCard";

export const BranchCards: React.FC = () => {
    return (
        <>
            <CardGroup data-id="branch-card-group">
                <BranchCard address="" availability="" links={[]} title="" />
            </CardGroup>
        </>
    );
};
