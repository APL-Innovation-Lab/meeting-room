import { Button } from "@trussworks/react-uswds";
import { sendTestEmail } from "~/lib/email-client";
import { useState } from "react";

type TestEmailButtonProps = {
    template:
        | "meetingAwaiting"
        | "meetingCanceled"
        | "meetingConfirmed"
        | "sharedCanceled"
        | "sharedConfirmed";
    buttonTitle: string;
    subject: string;
};

export default function TestEmailButton({ template, buttonTitle, subject }: TestEmailButtonProps) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleClick = async () => {
        setSending(true);
        await sendTestEmail({
            templateKey: template,
            subject: subject,
        });
        setSent(true);
    };

    if (sent) return null;

    return (
        <Button
            className="mx-auto mt-3 flex w-[300px] cursor-pointer justify-center border-[#026E98] bg-transparent font-sans text-sans-xs text-[#026E98] hover:bg-transparent hover:text-[#026E98]"
            type="button"
            onClick={handleClick}
        >
            {sending ? "Loading..." : buttonTitle}
        </Button>
    );
}
