import { Button, type ModalRef } from "@trussworks/react-uswds";
import { useRef, useState } from "react";

import { ChangeLocationModal } from "./ChangeLocationModal";
import { EnableLocationModal } from "./EnableLocationModal";
import { NearMeIcon } from "./NearMeIcon";
import { type CurrentLocationControls } from "./useCurrentLocation";

const BROWSER_FAILURE_MESSAGE = "Your browser could not determine your current location.";

function linkLabel(location: CurrentLocationControls["location"], isLocating: boolean): string {
    if (isLocating) return "Locating…";
    if (!location) return "Share Current Location for Distance";
    return location.postcode ? `Current Location: ${location.postcode}` : "Current Location";
}

/**
 * Sits beside the breadcrumbs and owns the whole current-location conversation: asking the browser
 * for a position, explaining how to undo a refusal, and swapping to a different ZIP code.
 */
export function CurrentLocationLink({
    isLocating,
    locateFromBrowser,
    locateFromPostcode,
    location,
}: CurrentLocationControls) {
    const enableModalRef = useRef<ModalRef>(null);
    const changeModalRef = useRef<ModalRef>(null);
    const [failureMessage, setFailureMessage] = useState<string | undefined>(undefined);

    async function useBrowserLocation() {
        const outcome = await locateFromBrowser();
        setFailureMessage(outcome === "failed" ? BROWSER_FAILURE_MESSAGE : undefined);
        if (outcome === "refused") enableModalRef.current?.toggleModal(undefined, true);
    }

    return (
        <div className="flex flex-col items-end">
            <Button
                className="m-0 flex items-center gap-[0.25rem] font-sans text-sans-xs"
                type="button"
                unstyled
                disabled={isLocating}
                onClick={() => {
                    if (location) changeModalRef.current?.toggleModal(undefined, true);
                    else void useBrowserLocation();
                }}
            >
                <NearMeIcon />
                {linkLabel(location, isLocating)}
            </Button>
            {failureMessage ? (
                <span className="font-sans text-sans-3xs text-secondary-dark" role="alert">
                    {failureMessage}
                </span>
            ) : null}
            <EnableLocationModal modalRef={enableModalRef} />
            <ChangeLocationModal
                isLocating={isLocating}
                modalRef={changeModalRef}
                postcode={location?.postcode}
                onSubmitPostcode={locateFromPostcode}
                onUseBrowserLocation={useBrowserLocation}
            />
        </div>
    );
}
