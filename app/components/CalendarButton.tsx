import { Button } from "@trussworks/react-uswds";
import React from "react";

type Props = {
    children: React.ReactNode;
};

export default function CalendarButton({ children }: Props) {
    return (
        <Button
            className="text-apl-green border-apl-green w-[75px] border-[3px] border-solid bg-white py-[12px] p-0 pointer-events-none"
            type="button"
        >
            {children}
        </Button>
    );
}
