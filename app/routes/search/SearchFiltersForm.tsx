import {
    Button,
    Checkbox,
    DatePicker,
    Label,
    Select,
    TextInputMask,
} from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";
import { Form, useLocation, useNavigation } from "react-router";
import { type LocationOption, type SearchFilters } from "./search.data.server";

const MIN_LOADING_STATE_MS = 500;

export namespace SearchFiltersForm {
    export interface Props {
        currentDate: string;
        locationOptions: LocationOption[];
        searchFilters: SearchFilters;
    }
}

export function SearchFiltersForm({
    currentDate,
    locationOptions,
    searchFilters,
}: SearchFiltersForm.Props) {
    const navigation = useNavigation();
    const location = useLocation();
    const isSearchLoading =
        navigation.state === "loading" &&
        navigation.location?.pathname === location.pathname &&
        (navigation.formMethod?.toLowerCase() === "get" ||
            navigation.location?.search !== location.search);
    const [showLoadingState, setShowLoadingState] = useState(false);
    const loadingShownAtRef = useRef<number | null>(null);
    const hideTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }

        if (isSearchLoading) {
            if (loadingShownAtRef.current === null) {
                loadingShownAtRef.current = Date.now();
            }
            setShowLoadingState(true);
            return;
        }

        if (!showLoadingState) {
            loadingShownAtRef.current = null;
            return;
        }

        const shownAt = loadingShownAtRef.current ?? Date.now();
        const elapsedMs = Date.now() - shownAt;
        const remainingMs = Math.max(0, MIN_LOADING_STATE_MS - elapsedMs);

        if (remainingMs === 0) {
            loadingShownAtRef.current = null;
            setShowLoadingState(false);
            return;
        }

        hideTimerRef.current = window.setTimeout(() => {
            loadingShownAtRef.current = null;
            setShowLoadingState(false);
            hideTimerRef.current = null;
        }, remainingMs);

        return () => {
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }
        };
    }, [isSearchLoading, showLoadingState]);

    return (
        <Form className="flex w-full max-w-none flex-col px-3" preventScrollReset>
            <div className="w-full">
                <Label className="font-bold" id="location-label" htmlFor="location">
                    Location
                </Label>
                <Select
                    className="max-w-none"
                    id="location"
                    name="location"
                    defaultValue={searchFilters.location}
                >
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
                        defaultValue={searchFilters.date || currentDate}
                        aria-labelledby="date-label"
                    />
                </div>

                <div>
                    <Label className="font-bold" id="duration-label" htmlFor="duration">
                        Duration
                    </Label>
                    <Select
                        className="w-[10rem]"
                        id="duration"
                        name="duration"
                        defaultValue={searchFilters.duration}
                    >
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
                        defaultValue={searchFilters.people}
                        aria-labelledby="people-label"
                    />
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-[1.25rem]">
                <div className="flex gap-[1.25rem]" id="amenities">
                    <Checkbox
                        id="display"
                        name="display"
                        label="Display/Screen"
                        defaultChecked={searchFilters.display}
                    />
                    <Checkbox
                        id="hdmi"
                        name="hdmi"
                        label="HDMI"
                        defaultChecked={searchFilters.hdmi}
                    />
                    <Checkbox
                        id="whiteboard"
                        name="whiteboard"
                        label="Whiteboard"
                        defaultChecked={searchFilters.whiteboard}
                    />
                </div>
                <Button className="w-auto" type="submit" disabled={showLoadingState}>
                    <span className="flex items-center gap-[0.5rem]">
                        <span className="h-[1em]">
                            {showLoadingState ? "Searching..." : "Search"}
                        </span>
                        {showLoadingState ? (
                            <svg
                                className="h-[1em] w-[1em] animate-spin"
                                viewBox="0 0 24 24"
                                focusable="false"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    fill="none"
                                    stroke="#007ea8"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray="40 24"
                                />
                            </svg>
                        ) : null}
                    </span>
                </Button>
            </div>

            <div className="border-b-1px border-base-light mt-3" />
        </Form>
    );
}
