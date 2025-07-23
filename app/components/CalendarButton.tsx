import { Button } from "@trussworks/react-uswds";
import React from "react";

type Props = {
    children: React.ReactNode;
};

export default function CalendarButton({ children }: Props) {
    return (
        <Button type="button" className="calendar-button">
            {children}
        </Button>
    );
}
