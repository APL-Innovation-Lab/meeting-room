import {
    Button,
    ErrorMessage,
    Label,
    Modal,
    ModalFooter,
    ModalHeading,
    ModalToggleButton,
    TextInput,
    type ModalRef,
} from "@trussworks/react-uswds";
import { useState, type FormEvent, type RefObject } from "react";

import { NearMeIcon } from "./NearMeIcon";
import { type PostcodeOutcome } from "./useCurrentLocation";

const CHANGE_LOCATION_MODAL_ID = "change-location-modal";

const POSTCODE_PATTERN = /^\d{5}$/;

const OUTCOME_MESSAGES: Record<Exclude<PostcodeOutcome, "located">, string> = {
    "unknown-postcode": "We could not find that ZIP code. Enter a five-digit US ZIP code.",
    failed: "We could not look up that ZIP code right now. Try again in a moment.",
};

export function ChangeLocationModal({
    isLocating,
    modalRef,
    onSubmitPostcode,
    onUseBrowserLocation,
    postcode,
}: {
    isLocating: boolean;
    modalRef: RefObject<ModalRef | null>;
    onSubmitPostcode: (postcode: string) => Promise<PostcodeOutcome>;
    onUseBrowserLocation: () => void;
    postcode?: string;
}) {
    const [error, setError] = useState<string | undefined>(undefined);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const submitted = new FormData(event.currentTarget).get("postcode");
        const candidate = typeof submitted === "string" ? submitted.trim() : "";
        if (!POSTCODE_PATTERN.test(candidate)) {
            setError("Enter a five-digit US ZIP code.");
            return;
        }

        const outcome = await onSubmitPostcode(candidate);
        setError(outcome === "located" ? undefined : OUTCOME_MESSAGES[outcome]);
        if (outcome === "located") modalRef.current?.toggleModal(undefined, false);
    }

    return (
        <Modal
            id={CHANGE_LOCATION_MODAL_ID}
            ref={modalRef}
            renderToPortal={false}
            aria-labelledby={`${CHANGE_LOCATION_MODAL_ID}-heading`}
        >
            <ModalHeading className="sr-only" id={`${CHANGE_LOCATION_MODAL_ID}-heading`}>
                Change your current location
            </ModalHeading>
            <form onSubmit={handleSubmit}>
                <Label className="font-bold" htmlFor="postcode">
                    Zipcode
                </Label>
                {error ? <ErrorMessage>{error}</ErrorMessage> : null}
                <TextInput
                    id="postcode"
                    name="postcode"
                    type="text"
                    key={postcode}
                    defaultValue={postcode}
                    inputMode="numeric"
                    maxLength={5}
                    validationStatus={error ? "error" : undefined}
                    autoComplete="postal-code"
                />
                <Button
                    className="mt-2 mb-0 flex items-center gap-[0.25rem] font-sans text-sans-xs"
                    type="button"
                    unstyled
                    onClick={() => {
                        modalRef.current?.toggleModal(undefined, false);
                        onUseBrowserLocation();
                    }}
                >
                    <NearMeIcon />
                    Use Current Location
                </Button>
                <ModalFooter className="flex items-center gap-[1rem]">
                    <Button className="m-0" type="submit" disabled={isLocating}>
                        Update
                    </Button>
                    <ModalToggleButton className="m-0" modalRef={modalRef} closer unstyled>
                        Go back
                    </ModalToggleButton>
                </ModalFooter>
            </form>
        </Modal>
    );
}
