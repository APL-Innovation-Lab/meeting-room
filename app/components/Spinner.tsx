import clsx from "clsx";

export namespace Spinner {
    export interface Props {
        /** Must set width and height via Tailwind classes */
        className: string;
        strokeColor?: string;
        strokeWidth?: number;
    }
}

export function Spinner({ className, strokeColor = "#007ea8", strokeWidth = 3 }: Spinner.Props) {
    return (
        <svg
            className={clsx("animate-spin", className)}
            viewBox="0 0 24 24"
            focusable="false"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray="40 24"
            />
        </svg>
    );
}
