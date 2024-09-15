import { useNavigate } from "@remix-run/react";
import { Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";
import Breadcrumbs from "~/components/Breadcrumbs";
import MeetingRoomFAQ from "~/components/MeetingRoomFAQ";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Meeting Spaces • ${parentTitle}` }]);

export const breadcrumbLinks = [
    { href: "https://library.austintexas.gov", text: "Home" },
    { href: "/", text: "Meeting Spaces" },
];

export default function Index() {
    const navigate = useNavigate();

    return (
        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <Header>
                        <div className="object-contain">
                            <img
                                alt="A room of people in attendance at a meeting"
                                className="rounded-t-md"
                                loading="lazy"
                                src="/meeting-spaces-header.jpg"
                            />
                        </div>
                    </Header>
                    <div className="ml-5 mr-5">
                        <div className="-mt-1 ml-1">
                            <Breadcrumbs links={breadcrumbLinks} />
                        </div>
                        <CardHeader className="-mt-3">
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2">
                                Meeting Spaces
                            </h1>
                            <p className="font-sans text-base-darker text-sans-xs">
                                Austin Public Library Meeting Spaces are
                                <strong className="font-bold"> free of charge</strong> and ideal for
                                discussion groups, panels, and lectures. Both paper and online
                                reservation requests are timestamped and processed in the order they
                                are received.
                            </p>
                        </CardHeader>
                        <div className="flex-col px-3">
                            <Label htmlFor="reservation-select">Reserve Online</Label>
                            <Select
                                defaultValue="empty"
                                id="reservation-select"
                                name="reservation-select"
                                onInput={event => {
                                    const value = (event.target as HTMLSelectElement)
                                        .selectedOptions[0].value;
                                    const param = new URLSearchParams({ "org-type": value });
                                    navigate(`/find-a-room?${param}`);
                                }}
                            >
                                <option disabled value="empty">
                                    - Select -{" "}
                                </option>
                                <option value="nonprofit">
                                    Room for Non-Profit/Non-Commercial Activity
                                </option>
                                <option value="business">Room for Business/Company Work</option>
                            </Select>
                            <div className="my-4">
                                <strong>Reserve In-Person Instead</strong>
                                <ul className="list-disc ml-4">
                                    <li>
                                        <Link href="#">Printable Form (PDF)</Link>
                                    </li>
                                    <li>
                                        <Link href="#">Sala de Reunión Forma de Solicitud</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mx-4 mb-4">
                            <MeetingRoomFAQ />
                        </div>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}
