import { type LngLat } from "~/utils/geo";

const GEOCODING_URL = "https://api.mapbox.com/search/geocode/v6";

type GeocodingResponse = {
    features?: Array<{
        properties?: {
            name?: string;
            coordinates?: { longitude?: number; latitude?: number };
        };
    }>;
};

async function geocode(path: string, accessToken: string): Promise<GeocodingResponse> {
    const response = await fetch(`${GEOCODING_URL}/${path}&access_token=${accessToken}`);
    if (!response.ok) {
        throw new Error(`Mapbox geocoding request failed with status ${response.status}`);
    }
    return (await response.json()) as GeocodingResponse;
}

/** The postcode containing a coordinate, or `undefined` when Mapbox covers no postcode there. */
export async function postcodeAt(
    [longitude, latitude]: LngLat,
    accessToken: string,
): Promise<string | undefined> {
    const body = await geocode(
        `reverse?longitude=${longitude}&latitude=${latitude}&types=postcode`,
        accessToken,
    );
    return body.features?.[0]?.properties?.name;
}

/** The center of a US postcode, or `undefined` when no postcode matches. */
export async function coordinatesOfPostcode(
    postcode: string,
    accessToken: string,
): Promise<LngLat | undefined> {
    const body = await geocode(
        `forward?q=${encodeURIComponent(postcode)}&types=postcode&country=us`,
        accessToken,
    );
    const coordinates = body.features?.[0]?.properties?.coordinates;
    if (coordinates?.longitude === undefined || coordinates.latitude === undefined) {
        return undefined;
    }
    return [coordinates.longitude, coordinates.latitude];
}
