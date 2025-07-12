import { Button } from "@trussworks/react-uswds";
import React from "react";

type Props = {
    children: React.ReactNode;
};

export default function CalendarButton({ children }: Props) {
    return (
        <Button
            type="button"
            style={{
                background: "#fff",
                paddingLeft: 2,
                paddingRight: 2,
                paddingTop: 12,
                paddingBottom: 12,
                color: "#1E6F98",
                border: "3px solid #1E6F98",
                width: "75px",
            }}
        >
            {children}
        </Button>
    );
}
