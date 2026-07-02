import { Button } from "react-email";

type EmailCalendarButtonProps = {
    marginRight: string;
    children: React.ReactNode;
};

export default function EmailCalendarButton({ marginRight, children }: EmailCalendarButtonProps) {
    return (
        <Button className={`font-sans font-bold text-[16px] px-[20px] py-[12px] rounded-[4px] border-[2px] border-[#026E98] text-[#026E98] mr-[${marginRight}]`}>
            {children}
        </Button>
    );
}