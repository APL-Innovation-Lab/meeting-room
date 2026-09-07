import {
    Modal,
    ModalFooter,
    ModalHeading,
    ModalToggleButton,
    type ModalRef,
} from "@trussworks/react-uswds";
import { type RefObject } from "react";

import { NearMeIcon } from "./NearMeIcon";

const ENABLE_LOCATION_MODAL_ID = "enable-location-modal";

/**
 * Shown when the browser reports the location permission as denied. The browser will not re-prompt
 * once refused, so the only way forward is the visitor changing the permission themselves.
 */
export function EnableLocationModal({ modalRef }: { modalRef: RefObject<ModalRef | null> }) {
    return (
        <Modal
            className="text-left"
            id={ENABLE_LOCATION_MODAL_ID}
            ref={modalRef}
            renderToPortal={false}
            aria-labelledby={`${ENABLE_LOCATION_MODAL_ID}-heading`}
        >
            <div className="flex flex-col items-center">
                <NearMeIcon className="bg-primary h-8 w-8 rounded-md p-1 text-white" />
                <ModalHeading
                    className="mt-2 font-sans text-sans-lg"
                    id={`${ENABLE_LOCATION_MODAL_ID}-heading`}
                >
                    Enable Location
                </ModalHeading>
            </div>
            <ol className="mt-3 list-decimal pl-4 font-sans text-sans-xs">
                <li>
                    Click the <strong>permissions icon</strong> in the address bar
                </li>
                <li>
                    Ensure location access is <strong>allowed</strong>
                </li>
                <li>
                    <strong>Reload</strong> this page, and try again
                </li>
            </ol>
            <ModalFooter>
                <ModalToggleButton className="m-0 w-full" modalRef={modalRef} closer>
                    Got It
                </ModalToggleButton>
            </ModalFooter>
        </Modal>
    );
}
