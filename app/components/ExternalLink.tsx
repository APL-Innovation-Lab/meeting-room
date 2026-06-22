import type { ComponentProps } from "react";

import clsx from "clsx";

export function ExternalLink({ children, className, target, rel, ...props }: ComponentProps<"a">) {
    const targets =
        target || rel ? { target, rel } : { target: "_blank", rel: "noopener noreferrer" };

    return (
        <a className={clsx("usa-link", "usa-link--external", className)} {...targets} {...props}>
            {children}
        </a>
    );
}
