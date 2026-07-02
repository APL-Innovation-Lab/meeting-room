import { Button } from "@trussworks/react-uswds";
import { sendTestEmail } from "~/lib/email-client";
import { useState } from "react";

type TestEmailButtonProps = {
    template: "meetingAwaiting" | "meetingCanceled" | "meetingConfirmed" | "sharedCanceled" | "sharedConfirmed";
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
            subject: subject
        },
        );
        setSent(true);
    };

    if (sent) return null;

    return <Button
        className="flex justify-center w-[300px] font-sans text-sans-xs mt-3 bg-transparent text-[#026E98] border-[#026E98] mx-auto hover:bg-transparent hover:text-[#026E98] cursor-pointer"
        type="button"
        onClick={handleClick}
    >
        {sending ? 'Loading...' : buttonTitle}
    </Button>;
}
