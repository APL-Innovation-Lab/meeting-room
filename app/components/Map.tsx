import * as mapbox from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

const CENTER: mapbox.LngLatLike = { lng: -97.74562898838249, lat: 30.311251794566203 };
const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";

export namespace Map {
    export interface Props {
        token: string;
        branchLngLats: mapbox.LngLatLike[];
        className?: string;
    }
}

export function Map({ token: accessToken, branchLngLats: lngLats, className }: Map.Props) {
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
            const marker = new mapbox.Marker({ color: "#006288" });
            marker.setLngLat(lngLat);
            marker.addTo(map);
            markersRef.current.push(marker);
        }
    }, [lngLats]);

    return <div className={className} ref={container} />;
}
