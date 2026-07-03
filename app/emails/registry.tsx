import type { ComponentType } from "react";

import MeetingRoomAwaitingEmail from "./templates/MeetingRoomAwaitingEmail";
import MeetingRoomCancellationEmail from "./templates/MeetingRoomCancellationEmail";
import MeetingRoomConfirmationEmail from "./templates/MeetingRoomConfirmationEmail";
import SharedLearningRoomCancellationEmail from "./templates/SharedLearningRoomCancellationEmail";
import SharedLearningRoomConfirmationEmail from "./templates/SharedLearningRoomConfirmationEmail";

export const emailRegistry = {
    meetingAwaiting: {
        component: MeetingRoomAwaitingEmail,
        subject: "Meeting Room - Awaiting Confirmation",
    },
    meetingCanceled: {
        component: MeetingRoomCancellationEmail,
        subject: "Meeting Room - Canceled",
    },
    meetingConfirmed: {
        component: MeetingRoomConfirmationEmail,
        subject: "Meeting Room - Confirmed",
    },
    sharedCanceled: {
        component: SharedLearningRoomCancellationEmail,
        subject: "Shared Learning Room - Canceled",
    },
    sharedConfirmed: {
        component: SharedLearningRoomConfirmationEmail,
        subject: "Shared Learning Room - Confirmed",
    },
} satisfies Record<string, { component: ComponentType<any>; subject: string }>;

export type EmailKey = keyof typeof emailRegistry;
