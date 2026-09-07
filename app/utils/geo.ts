export type LngLat = [number, number];

// Mean Earth radius. Great-circle distance is accurate to well under a tenth of a mile across
// Austin, which is all the branch list needs.
const EARTH_RADIUS_IN_MILES = 3958.7613;
const RADIANS_PER_DEGREE = Math.PI / 180;

export function milesBetween(from: LngLat, to: LngLat): number {
    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;
    const latitudeDelta = (toLat - fromLat) * RADIANS_PER_DEGREE;
    const longitudeDelta = (toLng - fromLng) * RADIANS_PER_DEGREE;
    const chord =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(fromLat * RADIANS_PER_DEGREE) *
            Math.cos(toLat * RADIANS_PER_DEGREE) *
            Math.sin(longitudeDelta / 2) ** 2;

    return 2 * EARTH_RADIUS_IN_MILES * Math.asin(Math.min(1, Math.sqrt(chord)));
}
