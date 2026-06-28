import { Accordion as UswdsAccordion, type AccordionProps } from "@trussworks/react-uswds";

import { PrimaryHeader } from "./Header.tsx";

type AccordionItem = AccordionProps["items"][number];

const FAQ = [
    {
        title: "Are food and drinks allowed?",
        content: (
            <>
                <div>
                    For Shared Learning Rooms, beverages with lids are allowed, but food is not.
                </div>
                <br />
                <div>
                    For Meeting Rooms, food and drink may be consumed in the meeting rooms as long
                    as the food or drinks are individually packaged such as packaged snacks,
                    individual containers of soda, pieces of fruit, box lunches, etc.
                </div>
            </>
        ),
    },
    {
        title: "How far ahead can I book a room?",
        content: <div>You can book a meeting room up to 90 days in advance.</div>,
    },
    {
        title: "How can I book a room when the library is closed?",
        content: (
            <div>
                No, you cannot book a room when the library is closed. Meeting rooms are only
                available during library operating hours.
            </div>
        ),
    },
    {
        title: "Can I book a room for a private event?",
        content: (
            <div>
                No, you cannot book a meeting room for a private event such as a shower, birthday
                party, or dance. The meeting rooms are intended for non-commercial, informational,
                educational, cultural, and civic purposes.
            </div>
        ),
    },
    {
        title: "How frequently can I book a room?",
        content: <div />,
    },
] satisfies Omit<AccordionItem, "id" | "headingLevel" | "expanded">[];

const ACCORDION_ITEMS = FAQ.map(
    (item, index) =>
        ({
            id: index.toString(),
            title: `${index + 1}. ${item.title}`,
            content: item.content,
            expanded: false,
            headingLevel: "h4",
        }) satisfies AccordionItem,
);

export function MeetingRoomFaq() {
    return (
        <>
            <PrimaryHeader>Frequently Asked Questions</PrimaryHeader>
            <MeetingRoomFaq.Accordion />
        </>
    );
}

export namespace MeetingRoomFaq {
    export function Accordion() {
        return <UswdsAccordion items={ACCORDION_ITEMS} />;
    }
}
