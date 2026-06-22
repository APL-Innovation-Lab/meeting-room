import { Button } from "@trussworks/react-uswds";
import React from "react";

type Props = {
    children: React.ReactNode;
};

export default function CalendarButton({ children }: Props) {
    return (
        <Button
            className="bg-white border-solid pointer-events-none w-[75px] border-[3px] border-apl-green p-0 py-[12px] text-apl-green"
            type="button"
        >
            {children}
        </Button>
    );
}
