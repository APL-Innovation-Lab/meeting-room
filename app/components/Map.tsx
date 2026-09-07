import * as mapbox from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

const CENTER: mapbox.LngLatLike = { lng: -97.74562898838249, lat: 30.311251794566203 };
const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";
const BRANCH_MARKER_COLOR = "#006288";
const USER_MARKER_COLOR = "#d83933";

export namespace Map {
    export interface Props {
        token: string;
        branchLngLats: mapbox.LngLatLike[];
        userLngLat?: mapbox.LngLatLike;
        className?: string;
    }
}

export function Map({
    token: accessToken,
    branchLngLats: lngLats,
    userLngLat,
    className,
}: Map.Props) {
    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapbox.Map | null>(null);
    const markersRef = useRef<mapbox.Marker[]>([]);

    useEffect(() => {
        if (mapRef.current) return;

        const map = new mapbox.Map({
            accessToken,
            container: container.current!,
            style: DEFAULT_STYLE,
            center: CENTER,
            zoom: 9.75,
            dragPan: true,
            scrollZoom: true,
            attributionControl: false,
        });

        map.on("dragend", () => console.log(map.getCenter()));
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current = [];
        };
    }, [accessToken]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        for (const marker of markersRef.current) marker.remove();
        markersRef.current = [];

        for (const lngLat of lngLats) {
            const marker = new mapbox.Marker({ color: BRANCH_MARKER_COLOR });
            marker.setLngLat(lngLat);
            marker.addTo(map);
            markersRef.current.push(marker);
        }

        if (userLngLat) {
            const userMarker = new mapbox.Marker({ color: USER_MARKER_COLOR });
            userMarker.setLngLat(userLngLat);
            userMarker.setPopup(new mapbox.Popup().setText("Your current location"));
            userMarker.addTo(map);
            markersRef.current.push(userMarker);
        }
    }, [lngLats, userLngLat]);

    return <div className={className} ref={container} />;
}
