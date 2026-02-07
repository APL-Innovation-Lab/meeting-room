import clsx from "clsx";
import { type ComponentProps } from "react";
import { RoomType } from "~/route-map";

function ExternalLink({ children, className, ...props }: ComponentProps<"a">) {
    const classes = clsx("usa-link", "usa-link--external", className);

    return (
        <a className={classes} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
        </a>
    );
}

export namespace SearchDescription {
    export interface Props {
        roomType: RoomType;
    }
}

export function SearchDescription({ roomType }: SearchDescription.Props) {
    if (roomType === RoomType.MeetingRoom) {
        return (
            <>
                For larger groups. Request 15 min time slots up to 15 hrs. Can reserve up to 90 days
                out.{" "}
                <ExternalLink href="https://library.austintexas.gov/meeting-rooms/calendar">
                    View Booked Calendar
                </ExternalLink>
                <br />
                <br />
                <strong className="mr-2">Reserve In-Person Instead</strong>
                <ExternalLink
                    className="mr-1"
                    href="https://library.austintexas.gov/library/pdf/meeting_room_form_2023.pdf"
                >
                    Printable Form (PDF)
                </ExternalLink>
                |
                <ExternalLink
                    className="ml-1"
                    href="https://library.austintexas.gov/library/pdf/meeting_room_form_2023_SPA.pdf"
                >
                    Sala de reunión forma de solicitud
                </ExternalLink>
            </>
        );
    }

    return (
        <>
            For smaller groups. Rooms can be booked up to 2 weeks and not less than 2 hours in
            advance. Book from 15 min up to 2 hrs maximum.{" "}
            <ExternalLink href="https://library.austintexas.gov/slr/calendar">
                View Booked Calendar
            </ExternalLink>
        </>
    );
}
