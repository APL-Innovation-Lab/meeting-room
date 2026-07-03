import { ExternalLink } from "~/components/ExternalLink";
import { Room } from "~/lib/room";

export namespace SearchDescription {
    export interface Props {
        roomKind: Room.Kind;
    }
}

export function SearchDescription({ roomKind }: SearchDescription.Props) {
    if (Room.isMeeting(roomKind)) {
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
