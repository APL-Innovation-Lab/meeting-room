import type { ReactNode } from "react";

export const FAQ_DATA: { question: string; answer: ReactNode }[] = [
    {
        question: "Are food and drinks allowed?",
        answer: (
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
        question: "How far ahead can I book a room?",
        answer: <div>You can book a meeting room up to 90 days in advance.</div>,
    },
    {
        question: "How can I book a room when the library is closed?",
        answer: (
            <div>
                No, you cannot book a room when the library is closed. Meeting rooms are only
                available during library operating hours.
            </div>
        ),
    },
    {
        question: "Can I book a room for a private event?",
        answer: (
            <div>
                No, you cannot book a meeting room for a private event such as a shower, birthday
                party, or dance. The meeting rooms are intended for non-commercial, informational,
                educational, cultural, and civic purposes.
            </div>
        ),
    },
];
