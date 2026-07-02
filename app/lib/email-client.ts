import type { EmailKey } from "../emails/registry";

export interface SendEmailResult {
    previewUrl: string | false;
    subject: string;
    to: string;
}

export async function sendMockEmail<K extends EmailKey>(options: {
    to: string;
    templateKey: K;
    props: Record<string, unknown>;
    subject?: string;
}): Promise<SendEmailResult> {
    const res = await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send email");
    }

    return res.json();
}

export async function sendTestEmail<K extends EmailKey>(options: {
    templateKey: K;
    subject: string;
    props?: Record<string, unknown>;
    to?: string;
}) {
    const { previewUrl } = await sendMockEmail({
        to: options.to ?? "test@example.com",
        templateKey: options.templateKey,
        props: options.props ?? {},
        subject: options.subject,
    });

    if (previewUrl) {
        window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
}
