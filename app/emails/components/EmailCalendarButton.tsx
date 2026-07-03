import { Button } from "react-email";

type EmailCalendarButtonProps = {
    href: string;
    download?: any;
    marginRight: string;
    children: React.ReactNode;
};

export default function EmailCalendarButton({
    href,
    download,
    marginRight,
    children,
}: EmailCalendarButtonProps) {
    return (
        <Button
            className={`rounded-[4px] border-[2px] border-[#026E98] px-[20px] py-[12px] font-sans text-[16px] font-bold text-[#026E98] mr-[${marginRight}]`}
            href={href}
            download={download}
        >
            {children}
        </Button>
    );
}
