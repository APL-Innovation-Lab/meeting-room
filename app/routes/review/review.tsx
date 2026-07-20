import {
    Alert,
    Button,
    Card,
    CardGroup,
    CardHeader,
    Checkbox,
    ErrorMessage,
    Fieldset,
    Label,
    Link,
    Tag,
    TextInput,
} from "@trussworks/react-uswds";
import { useState } from "react";
import { data, Form, href, redirect, useNavigation } from "react-router";
import { z } from "zod";

import { apl, ReservationOptionsSchema } from "~/lib/apl-client/apl-live-client.server";
import {
    RoomAlreadyReservedError,
    RoomNotAvailableAtTimeError,
    RoomNotAvailableOnDateError,
    RoomNotFoundError,
} from "~/lib/apl-client/errors";
import { Room } from "~/lib/room";
import { site } from "~/lib/site";

import type { Route } from "./+types/review";

import {
    createReviewRoomSummary,
    findReviewRoom,
    parseReviewSelection,
    searchPageUrl,
} from "./review.data.server";

const POLICY_LINKS = {
    meetingRoomPolicy: "https://library.austintexas.gov/meeting-rooms/policies",
    historyCenterGuidelines: "https://library.austintexas.gov/ahc/meeting-room",
    facilitiesGuidelines: "https://library.austintexas.gov/node/1734581",
    sharedLearningRoomPolicy: "https://library.austintexas.gov/node/1734963",
};

const FIELD_ERROR_MESSAGES: Record<string, string> = {
    agree: "Agree to the policies before submitting your request",
    emailAddress: "Enter a valid email address",
    fullName: "Enter your full name",
    meetingTopic: "Enter a meeting topic",
    orgName: "Enter the group or organization name",
    orgPurpose: "Enter the purpose of the group or organization",
    phoneNumber: "Enter a valid phone number",
    website: "Enter a valid website address (including https://), or leave it blank",
};

const SELECTION_INCOMPLETE_MESSAGE =
    "Your room selection is incomplete. Return to search and pick a room and time.";

const MEETING_ROOM_REQUIRED_FIELDS = [
    "orgName",
    "orgPurpose",
    "meetingTopic",
    "phoneNumber",
    "emailAddress",
    "fullName",
];
const SHARED_LEARNING_REQUIRED_FIELDS = ["meetingTopic", "fullName", "emailAddress"];

export async function loader({ params, url }: Route.LoaderArgs) {
    const roomKind = params.roomKind as Room.Kind;
    const selection = parseReviewSelection(url.searchParams);
    if (!selection) throw redirect(searchPageUrl(roomKind, url.searchParams));

    const [room, branchDirectoryResult] = await Promise.all([
        findReviewRoom(roomKind, selection),
        apl.getBranchDirectory(),
    ]);
    if (!room || !room.info.availableTimes.includes(selection.time)) {
        throw redirect(searchPageUrl(roomKind, url.searchParams));
    }

    // Degrade gracefully (like search) if the directory feed fails: the page just falls back to
    // whatever address/image the room itself carries.
    const branchDirectory = branchDirectoryResult.error ? [] : branchDirectoryResult.data;

    return { selection, summary: createReviewRoomSummary(room, selection, branchDirectory) };
}

function formValue(formData: FormData, name: string): string {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
}

function submissionErrorMessage(error: Error): string {
    if (error instanceof RoomAlreadyReservedError) {
        return "Someone just booked this room for the selected time. Please pick a different time.";
    }
    if (
        error instanceof RoomNotFoundError ||
        error instanceof RoomNotAvailableOnDateError ||
        error instanceof RoomNotAvailableAtTimeError
    ) {
        return "This room is no longer available at the selected time. Please search again.";
    }
    return "Something went wrong while submitting your request. Please try again.";
}

export async function action({ params, request }: Route.ActionArgs) {
    const formData = await request.formData();

    const shared = {
        roomId: formValue(formData, "roomId"),
        date: formValue(formData, "date"),
        time: formValue(formData, "time"),
        meetingTopic: formValue(formData, "meetingTopic"),
        fullName: formValue(formData, "fullName"),
        emailAddress: formValue(formData, "emailAddress"),
    };
    const submission = Room.isMeeting(params.roomKind)
        ? {
              ...shared,
              roomKind: "meeting-room" as const,
              orgName: formValue(formData, "orgName"),
              orgPurpose: formValue(formData, "orgPurpose"),
              phoneNumber: formValue(formData, "phoneNumber"),
              website: formValue(formData, "website") || undefined,
          }
        : { ...shared, roomKind: "shared-learning-room" as const };

    const errors: Record<string, string> = {};
    if (formData.get("agree") !== "on") {
        errors.agree = FIELD_ERROR_MESSAGES.agree;
    }

    const parsed = ReservationOptionsSchema.safeParse(submission);
    if (!parsed.success) {
        for (const field of Object.keys(z.flattenError(parsed.error).fieldErrors)) {
            if (field in FIELD_ERROR_MESSAGES) {
                errors[field] = FIELD_ERROR_MESSAGES[field];
            } else {
                // roomId/date/time travel in hidden inputs; a blank one means a tampered or stale form.
                errors.form = SELECTION_INCOMPLETE_MESSAGE;
            }
        }
    }
    if (!parsed.success || Object.keys(errors).length > 0) {
        return data({ errors }, { status: 400 });
    }

    const result = await apl.createReservation(parsed.data);
    if (result.error) {
        return data({ errors: { form: submissionErrorMessage(result.error) } }, { status: 409 });
    }

    return redirect(
        `${href("/:roomKind/confirm", { roomKind: params.roomKind })}?reservationId=${result.data.id}`,
    );
}

function PleaseNote() {
    return (
        <>
            <li>
                If you are booking less than <b>3 days</b> in advance, please contact the branch
                directly to assure your request is processed in time.
            </li>
            <li>
                Reservations may be made up to <b>90 days</b> in advance
            </li>
            <li>
                A group may reserve 1 meeting room up to <b>3 times in a rolling 90 day</b> period
            </li>
        </>
    );
}

const DETAILS = {
    sharedLearning: [
        "Rooms can be booked up to 2 weeks and not less than 2 hours in advance",
        "Individuals can make 1 reservation per day and up to 5 reservations per month",
        "Beverages with lids are allowed. Please no food in the rooms",
        "If the reserving party is more than 15 minutes late, they forfeit the reservation",
    ],
    meetingRooms: {
        rules: [
            "Groups or organizations must be not-for-profit",
            "Must not use the meeting room for commercial activity",
            "Meeting must be free and open to the public",
            "Must include 3 or more individuals",
        ],
    },
};

export default function Component({ actionData, loaderData, params }: Route.ComponentProps) {
    const roomKind = params.roomKind;
    const isMeetingRoom = Room.isMeeting(roomKind);
    const { selection, summary } = loaderData;
    const errors = actionData?.errors;

    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const [isFormComplete, setIsFormComplete] = useState(false);
    const requiredFields = isMeetingRoom
        ? MEETING_ROOM_REQUIRED_FIELDS
        : SHARED_LEARNING_REQUIRED_FIELDS;

    function handleFormChange(event: React.FormEvent<HTMLFormElement>) {
        const formData = new FormData(event.currentTarget);
        const allFilled = requiredFields.every(field => {
            const value = formData.get(field);
            return typeof value === "string" && value.trim() !== "";
        });
        setIsFormComplete(allFilled && formData.get("agree") === "on");
    }

    return (
        <div className="flex justify-center" data-wide>
            <title>{`Review Reservation • ${site.title}`}</title>
            <CardGroup className="max-w-230 min-w-120">
                <Card>
                    <div className="mr-5 ml-5 justify-center">
                        <CardHeader className="pl-0">
                            <h1 className="py-2 font-sans text-[40px] font-bold usa-card__heading">
                                Review Details
                            </h1>

                            <div className="flex flex-col">
                                <div>
                                    <span className="font-bold">Date:</span> {summary.dateLabel}
                                </div>
                                <div>
                                    <span className="font-bold">Time:</span> {summary.timeLabel}
                                </div>
                            </div>
                        </CardHeader>

                        <hr className="my-4 border-t border-base-light" />

                        <div className="flex w-full flex-row items-center justify-between gap-6">
                            <div className="w-full">
                                <h3 className="text-body-lg font-bold">{summary.branch}</h3>
                                <p>{summary.address}</p>
                                <div className="flex flex-col gap-1 py-1">
                                    <h4 className="text-body-sm font-bold">{summary.name}</h4>
                                    <div className="flex flex-col">
                                        <span>{summary.kindLabel}</span>
                                        {summary.floor !== undefined && (
                                            <span>Floor {summary.floor}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="">
                                    <Tag className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case">
                                        <img
                                            className="h-2 w-2 shrink-0"
                                            alt=""
                                            height={16}
                                            src="/img/material-icons/people.svg"
                                            width={16}
                                            aria-hidden="true"
                                        />
                                        {summary.capacity}
                                    </Tag>
                                    {summary.amenities.map(amenity => (
                                        <Tag
                                            className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case"
                                            key={amenity.label}
                                        >
                                            <img
                                                className="h-2 w-2 shrink-0"
                                                alt=""
                                                height={16}
                                                src={amenity.icon}
                                                width={16}
                                                aria-hidden="true"
                                            />
                                            {amenity.label}
                                        </Tag>
                                    ))}
                                </div>
                            </div>

                            <img className="h-full w-62 object-cover" alt="" src={summary.image} />
                        </div>

                        <hr className="my-4 border-t border-base-light" />

                        <div>
                            <h3 className="mb-3 text-body-lg font-bold">
                                {isMeetingRoom ? "Request to Book Room" : "Book Room"}
                            </h3>
                            <p className="font-bold">
                                {isMeetingRoom ? "Please Note" : "Before you book"}
                            </p>
                            <ul className="list-disc pl-3">
                                {isMeetingRoom ? (
                                    <PleaseNote />
                                ) : (
                                    DETAILS.sharedLearning.map(detail => (
                                        <li key={detail}>{detail}</li>
                                    ))
                                )}
                            </ul>

                            {isMeetingRoom && (
                                <Card
                                    containerProps={{
                                        className: "bg-base-lightest border-0 p-2 mt-4 rounded-0",
                                    }}
                                >
                                    <h4>RULES</h4>
                                    <ul className="list-disc pl-3">
                                        {DETAILS.meetingRooms.rules.map(rule => (
                                            <li key={rule}>{rule}</li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
                        </div>

                        <Form
                            className="flex flex-col gap-3"
                            method="post"
                            noValidate
                            onChange={handleFormChange}
                        >
                            <input name="roomId" type="hidden" value={selection.roomId} />
                            <input name="date" type="hidden" value={selection.date} />
                            <input name="time" type="hidden" value={selection.time} />

                            {isMeetingRoom ? (
                                <MeetingRoomForm errors={errors} />
                            ) : (
                                <SharedLearningForm errors={errors} />
                            )}

                            {errors?.form && (
                                <Alert headingLevel="h4" slim type="error">
                                    {errors.form}
                                </Alert>
                            )}

                            <Button
                                className="w-fit"
                                disabled={!isFormComplete || isSubmitting}
                                type="submit"
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                        </Form>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

// Renders exactly the markup the design implemented (Label + TextInput inside the Fieldset); the
// only addition is an error message that appears when the server rejects the submitted value.
function ReviewField({
    error,
    hint,
    label,
    name,
    required = false,
    type = "text",
}: {
    error?: string;
    hint?: string;
    label: string;
    name: string;
    required?: boolean;
    type?: "text" | "email" | "tel";
}) {
    const errorId = `${name}-error`;
    return (
        <>
            <Label htmlFor={name} requiredMarker={required}>
                {label}
            </Label>
            {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
            <TextInput
                className="max-w-full"
                id={name}
                name={name}
                required={required}
                type={type}
                aria-describedby={error ? errorId : undefined}
            />
            {hint && <p className="text-base-default">{hint}</p>}
        </>
    );
}

function MeetingRoomForm({ errors }: { errors?: Record<string, string> }) {
    return (
        <>
            <Fieldset className="w-full">
                <ReviewField
                    name="orgName"
                    error={errors?.orgName}
                    label="Group or Organization Name"
                    required
                />
                <ReviewField
                    name="orgPurpose"
                    error={errors?.orgPurpose}
                    label="Purpose of Group or Organization"
                    required
                />
                <ReviewField
                    name="meetingTopic"
                    error={errors?.meetingTopic}
                    hint="Topic will appear on calendar"
                    label="Meeting Topic"
                    required
                />
                <ReviewField name="website" error={errors?.website} label="Website" />
                <ReviewField
                    name="phoneNumber"
                    error={errors?.phoneNumber}
                    label="Phone Number"
                    required
                    type="tel"
                />
                <ReviewField
                    name="emailAddress"
                    error={errors?.emailAddress}
                    label="Email Address"
                    required
                    type="email"
                />
                <ReviewField
                    name="fullName"
                    error={errors?.fullName}
                    label="Your Full Name"
                    required
                />
            </Fieldset>

            {errors?.agree && <ErrorMessage id="agree-error">{errors.agree}</ErrorMessage>}
            <Checkbox
                id="agree"
                name="agree"
                label={
                    <>
                        I agree to ensure that my organization will abide by{" "}
                        <Link
                            href={POLICY_LINKS.meetingRoomPolicy}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Meeting Room Policies
                        </Link>
                        ,{" "}
                        <Link
                            href={POLICY_LINKS.historyCenterGuidelines}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Austin History Center Guidelines
                        </Link>
                        , and the{" "}
                        <Link
                            href={POLICY_LINKS.facilitiesGuidelines}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Care and Use of Facilities Guidelines
                        </Link>{" "}
                        with regard to meeting room use.
                    </>
                }
                required
                aria-describedby={errors?.agree ? "agree-error" : undefined}
            />
        </>
    );
}

function SharedLearningForm({ errors }: { errors?: Record<string, string> }) {
    return (
        <>
            <Fieldset className="w-full">
                <ReviewField
                    name="meetingTopic"
                    error={errors?.meetingTopic}
                    hint="Topic will appear on calendar"
                    label="Meeting Topic"
                    required
                />
                <ReviewField name="fullName" error={errors?.fullName} label="Full Name" required />
                <ReviewField
                    name="emailAddress"
                    error={errors?.emailAddress}
                    label="Email Address"
                    required
                    type="email"
                />
            </Fieldset>

            {errors?.agree && <ErrorMessage id="agree-error">{errors.agree}</ErrorMessage>}
            <Checkbox
                id="agree"
                name="agree"
                label={
                    <>
                        I agree to abide by the{" "}
                        <Link
                            href={POLICY_LINKS.sharedLearningRoomPolicy}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Shared Learning Room Policy
                        </Link>
                        .
                    </>
                }
                required
                aria-describedby={errors?.agree ? "agree-error" : undefined}
            />
        </>
    );
}
