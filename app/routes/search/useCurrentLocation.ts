import { useCallback, useEffect, useState } from "react";

import { coordinatesOfPostcode, postcodeAt } from "~/lib/mapbox-geocoding";
import { type LngLat } from "~/utils/geo";

// The visitor's location stays in the tab: it is never sent to the server, and it is forgotten when
// the tab closes. Keeping it in sessionStorage is what survives leaving the search page and coming
// back without asking the browser for permission again.
const STORAGE_KEY = "apl.current-location";
const POSITION_TIMEOUT_MS = 10_000;
const PERMISSION_DENIED = 1;

export interface CurrentLocation {
    lngLat: LngLat;
    postcode?: string;
}

export type BrowserLocationOutcome = "located" | "refused" | "failed";
export type PostcodeOutcome = "located" | "unknown-postcode" | "failed";

export interface CurrentLocationControls {
    location?: CurrentLocation;
    isLocating: boolean;
    locateFromBrowser: () => Promise<BrowserLocationOutcome>;
    locateFromPostcode: (postcode: string) => Promise<PostcodeOutcome>;
}

function readStoredLocation(): CurrentLocation | undefined {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return undefined;

    try {
        const parsed = JSON.parse(stored) as CurrentLocation;
        const [longitude, latitude] = parsed.lngLat ?? [];
        if (typeof longitude !== "number" || typeof latitude !== "number") return undefined;
        return parsed;
    } catch {
        return undefined;
    }
}

function currentPosition(): Promise<GeolocationPosition> {
    const { promise, resolve, reject } = Promise.withResolvers<GeolocationPosition>();
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: POSITION_TIMEOUT_MS });
    return promise;
}

export function useCurrentLocation(accessToken: string): CurrentLocationControls {
    const [location, setLocation] = useState<CurrentLocation | undefined>(undefined);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        setLocation(readStoredLocation());
    }, []);

    const remember = useCallback((next: CurrentLocation) => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setLocation(next);
    }, []);

    const locateFromBrowser = useCallback(async (): Promise<BrowserLocationOutcome> => {
        if (!navigator.geolocation) return "failed";

        setIsLocating(true);
        try {
            const position = await currentPosition();
            const lngLat: LngLat = [position.coords.longitude, position.coords.latitude];
            // A missing postcode only costs the label its ZIP; distances still work without it.
            const postcode = await postcodeAt(lngLat, accessToken).catch(() => undefined);
            remember({ lngLat, postcode });
            return "located";
        } catch (error) {
            const code = (error as GeolocationPositionError | undefined)?.code;
            return code === PERMISSION_DENIED ? "refused" : "failed";
        } finally {
            setIsLocating(false);
        }
    }, [accessToken, remember]);

    const locateFromPostcode = useCallback(
        async (postcode: string): Promise<PostcodeOutcome> => {
            setIsLocating(true);
            try {
                const lngLat = await coordinatesOfPostcode(postcode, accessToken);
                if (!lngLat) return "unknown-postcode";
                remember({ lngLat, postcode });
                return "located";
            } catch {
                return "failed";
            } finally {
                setIsLocating(false);
            }
        },
        [accessToken, remember],
    );

    return { location, isLocating, locateFromBrowser, locateFromPostcode };
}
