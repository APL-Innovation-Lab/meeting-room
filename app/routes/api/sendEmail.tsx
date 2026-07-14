import type { ActionFunctionArgs } from "react-router";

import nodemailer from "nodemailer";
import { render } from "react-email";

import { emailRegistry, type EmailKey } from "~/emails/registry";

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
    return cachedTransporter;
}

export async function action({ request }: ActionFunctionArgs) {
    const {
        to,
        templateKey,
        props,
        subject: subjectOverride,
    } = (await request.json()) as {
        to: string;
        templateKey: EmailKey;
        props: Record<string, unknown>;
        subject?: string;
    };

    const entry = emailRegistry[templateKey];
    if (!entry) {
        return Response.json({ error: `Unknown templateKey: ${templateKey}` }, { status: 400 });
    }

    try {
        const { component: EmailComponent, subject: defaultSubject } = entry;
        const subject = subjectOverride ?? defaultSubject;
        const html = await render(<EmailComponent {...props} />);

        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: '"APL Meeting Room Prototype" <apl-meeting-room-prototype@example.com>',
            to,
            subject,
            html,
        });

        return Response.json({
            previewUrl: nodemailer.getTestMessageUrl(info),
            subject,
            to,
        });
    } catch (err) {
        console.error("Failed to send test email:", err);
        return Response.json({ error: "Failed to send email" }, { status: 500 });
    }
}
