/** The USWDS `near_me` icon, inlined so it inherits the surrounding text color. */
export function NearMeIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="currentColor"
            height="1em"
            viewBox="0 0 24 24"
            width="1em"
            focusable="false"
            aria-hidden="true"
        >
            <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
        </svg>
    );
}
