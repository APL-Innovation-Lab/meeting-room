import { PropsWithChildren } from "react";

export function PrimaryHeader({ children }: PropsWithChildren) {
    return <h1 className="font-sans text-sans-lg font-bold">{children}</h1>;
}
