import {
    Button,
    Checkbox,
    DatePicker,
    Label,
    Select,
    TextInputMask,
} from "@trussworks/react-uswds";
import { Form } from "react-router";
import { type LocationOption } from "./search.data.server";

export namespace SearchFiltersForm {
    export interface Props {
        currentDate: string;
        locationOptions: LocationOption[];
    }
}

export function SearchFiltersForm({ currentDate, locationOptions }: SearchFiltersForm.Props) {
    return (
        <Form className="flex w-full max-w-none flex-col px-3">
            <div className="w-full">
                <Label className="font-bold" id="location-label" htmlFor="location">
                    Location
                </Label>
                <Select className="max-w-none" id="location" name="location">
                    <option value="all">All Available Locations</option>
                    {locationOptions.map(option => (
                        <option key={option.locationId} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="flex justify-between gap-[1.25rem]">
                <div className="w-full">
                    <Label className="font-bold" id="date-label" htmlFor="date">
                        Date
                    </Label>
                    <DatePicker
                        id="date"
                        name="date"
                        defaultValue={currentDate}
                        aria-labelledby="date-label"
                    />
                </div>

                <div>
                    <Label className="font-bold" id="duration-label" htmlFor="duration">
                        Duration
                    </Label>
                    <Select className="w-[10rem]" id="duration" name="duration" defaultValue="120">
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">1 hr</option>
                        <option value="75">1 hr 15 min</option>
                        <option value="90">1 hr 30 min</option>
                        <option value="105">1 hr 45 min</option>
                        <option value="120">2 hr</option>
                    </Select>
                </div>

                <div className="w-full">
                    <Label className="font-bold" id="people-label" htmlFor="people">
                        Number of People
                    </Label>
                    <TextInputMask
                        className="w-full"
                        id="people"
                        name="people"
                        type="number"
                        mask="___"
                        pattern="\d{3}"
                        aria-labelledby="people-label"
                    />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-[1.25rem]">
                <div className="flex gap-[1.25rem]" id="amenities">
                    <Checkbox id="display" name="display" label="Display/Screen" />
                    <Checkbox id="hdmi" name="hdmi" label="HDMI" />
                    <Checkbox id="whiteboard" name="whiteboard" label="Whiteboard" />
                </div>
                <Button className="w-auto" type="submit">
                    Search
                </Button>
            </div>
        </Form>
    );
}
