import { Accordion, type AccordionProps } from "@trussworks/react-uswds";

import { FAQ_DATA } from "~/lib/constants";

type AccordionItemProps = AccordionProps["items"][number];

function MeetingRoomFAQ() {
    const accordionItems: AccordionItemProps[] = FAQ_DATA.map(
        (entry, index): AccordionItemProps => ({
            title: `${index + 1}. ${entry.question}`,
            content: entry.answer,
            expanded: false,
            id: index.toString(),
            headingLevel: "h4",
        }),
    );

    return (
        <>
            <h1 className="font-bold text-sans-lg font-sans">Frequently Asked Questions</h1>
            <Accordion items={accordionItems} />
        </>
    );
}

export default MeetingRoomFAQ;
