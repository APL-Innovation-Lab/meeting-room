import {
    Button,
    Card,
    CardGroup,
    CardHeader,
    Checkbox,
    Fieldset,
    Label,
    Link,
    Tag,
    TextInput,
} from "@trussworks/react-uswds";
import { href } from "react-router";

import { Room } from "~/lib/room";
import { site } from "~/lib/site";

import type { Route } from "./+types/review";

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

export default function Component({ params }: Route.ComponentProps) {
    const roomKind = params.roomKind;
    const isMeetingRoom = Room.isMeeting(roomKind);

    return (
        <div data-wide className="flex justify-center">
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
                                    <span className="font-bold">Date:</span> Mon 3/24/2024
                                </div>
                                <div>
                                    <span className="font-bold">Time:</span> 11:00 AM - 12:00 PM
                                </div>
                            </div>
                        </CardHeader>

                        <hr className="border-t border-base-light my-4" />

                        <div className="w-full flex flex-row justify-between gap-6 items-center">
                            <div className="w-full">
                                <h3 className="font-bold text-body-lg">Central Library</h3>
                                <p>710 W Cesar Chavez St, Austin, TX 78701</p>
                                <div className="py-1 flex flex-col gap-1">
                                    <h4 className="font-bold text-body-sm">
                                        Shared Learning - 408
                                    </h4>
                                    <div className="flex flex-col">
                                        <span>Shared Learning Room</span>
                                        <span>Floor 1</span>
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
                                        8
                                    </Tag>
                                    <Tag className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case">
                                        <img
                                            className="h-2 w-2 shrink-0"
                                            alt=""
                                            height={16}
                                            src="/img/material-icons/airplay.svg"
                                            width={16}
                                            aria-hidden="true"
                                        />
                                        Display/Screen
                                    </Tag>
                                    <Tag className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case">
                                        <img
                                            className="h-2 w-2 shrink-0"
                                            alt=""
                                            height={16}
                                            src="/img/material-icons/settings_input_hdmi.svg"
                                            width={16}
                                            aria-hidden="true"
                                        />
                                        TV Cart
                                    </Tag>
                                    <Tag className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case">
                                        <img
                                            className="h-2 w-2 shrink-0"
                                            alt=""
                                            height={16}
                                            src="/img/material-icons/settings_input_hdmi.svg"
                                            width={16}
                                            aria-hidden="true"
                                        />
                                        HDMI
                                    </Tag>
                                    <Tag className="inline-flex! items-center gap-05 bg-base-lighter py-05! text-ink normal-case">
                                        <img
                                            className="h-2 w-2 shrink-0"
                                            alt=""
                                            height={16}
                                            src="/img/material-icons/desktop_windows.svg"
                                            width={16}
                                            aria-hidden="true"
                                        />
                                        Whiteboard
                                    </Tag>
                                </div>
                            </div>

                            <img
                                className="h-full w-62 object-cover"
                                src="https://library.austintexas.gov/library/slr-615.jpg"
                            />
                        </div>

                        <hr className="border-t border-base-light my-4" />

                        <div>
                            <h3 className="font-bold mb-3 text-body-lg">
                                {isMeetingRoom ? "Request to Book Room" : "Book Room"}
                            </h3>
                            <p className="font-bold">
                                {isMeetingRoom ? "Please Note" : "Before you book"}
                            </p>
                            <ul className="pl-3 list-disc">
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
                                    <ul className="pl-3 list-disc">
                                        {DETAILS.meetingRooms.rules.map(rule => (
                                            <li key={rule}>{rule}</li>
                                        ))}
                                    </ul>
                                </Card>
                            )}
                        </div>

                        <form className="flex flex-col gap-3">
                            {isMeetingRoom ? <MeetingRoomForm /> : <SharedLearningForm />}

                            <Button className="w-fit" type="submit">
                                Submit
                            </Button>
                        </form>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}

function MeetingRoomForm() {
    return (
        <>
            <Fieldset className="w-full">
                <Label requiredMarker htmlFor="name">
                    Group or Organization Name
                </Label>
                <TextInput className="max-w-full" id="name" name="name" type="text" />

                <Label requiredMarker htmlFor="purpose">
                    Purpose of Group or Organization
                </Label>
                <TextInput className="max-w-full" id="purpose" name="purpose" type="text" />

                <Label requiredMarker htmlFor="meeting-topic">
                    Meeting Topic
                </Label>
                <TextInput
                    className="max-w-full"
                    id="meeting-topic"
                    name="meeting-topic"
                    type="text"
                />
                <p className="text-base-default">Topic will appear on calendar</p>

                <Label htmlFor="website">Website</Label>
                <TextInput className="max-w-full" id="website" name="website" type="text" />

                <Label requiredMarker htmlFor="phone">
                    Phone Number
                </Label>
                <TextInput className="max-w-full" id="phone" name="phone" type="text" />

                <Label requiredMarker htmlFor="email-address">
                    Email Address
                </Label>
                <TextInput
                    className="max-w-full"
                    id="email-address"
                    name="email-address"
                    type="text"
                />

                <Label requiredMarker htmlFor="full-name">
                    Your Full Name
                </Label>
                <TextInput className="max-w-full" id="full-name" name="full-name" type="text" />
            </Fieldset>

            <Checkbox
                id="agree"
                label={
                    <>
                        I agree to ensure that my organization will abide by{" "}
                        <Link href="">Meeting Room Policies</Link>,
                        <Link href="">Austin History Center Guidelines</Link>, and the{" "}
                        <Link href="">Care and Use of Facilities Guidelines</Link> regard to meeting
                        room use.
                    </>
                }
                name="agree"
            />
        </>
    );
}

function SharedLearningForm() {
    return (
        <>
            <Fieldset className="w-full">
                <Label requiredMarker htmlFor="meeting-topic">
                    Meeting Topic
                </Label>
                <TextInput
                    className="max-w-full"
                    id="meeting-topic"
                    name="meeting-topic"
                    type="text"
                />
                <p className="text-base-default">Topic will appear on calendar</p>

                <Label requiredMarker htmlFor="full-name">
                    Full Name
                </Label>
                <TextInput className="max-w-full" id="full-name" name="full-name" type="text" />

                <Label requiredMarker htmlFor="email-address">
                    Email Address
                </Label>
                <TextInput
                    className="max-w-full"
                    id="email-address"
                    name="email-address"
                    type="text"
                />
            </Fieldset>

            <Checkbox
                id="agree"
                label={
                    <>
                        I agree to abide by the <Link href="">Shared Learning Room Policy</Link>.
                    </>
                }
                name="agree"
            />
        </>
    );
}
