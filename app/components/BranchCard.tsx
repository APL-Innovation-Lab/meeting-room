import { Card } from "@trussworks/react-uswds";
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

export const BranchCard: React.FC<BranchCardProps> = ({ ...BranchCardProps }) => {
    return (
        <>
            <Card data-id="branch-card">
                <div className="flex">
                    <img
                        alt="An Austin Public Library Branch"
                        className=""
                        loading="lazy"
                        src="/central-library.png"
                    />
                    <div>
                        <div className="text-primary-default text-sans-lg font-bold px-3 mb-1">
                            Carver Branch
                        </div>
                        <p className="px-3 text-sans-md">710 W Cesar Chavez</p>
                        <div className="px-3 my-4">
                            <strong className="text-sans-md">2 Available</strong>
                        </div>
                    </div>
                </div>
            </Card>
        </>
    );
};
