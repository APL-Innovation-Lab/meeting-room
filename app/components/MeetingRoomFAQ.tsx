import { Accordion } from "@trussworks/react-uswds";
import type { AccordionItemProps } from "node_modules/@trussworks/react-uswds/lib/components/Accordion/Accordion";
import { FAQ_DATA } from "~/shared/constants";

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
        <div>
            <h1 className="font-bold text-sans-lg">Frequently Asked Questions</h1>
            <Accordion items={accordionItems} />
        </div>
    );
}

export default MeetingRoomFAQ;
