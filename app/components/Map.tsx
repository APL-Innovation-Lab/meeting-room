import * as mapbox from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
const { Map: MapboxMap, Marker } = mapbox;

const CENTER: mapbox.LngLatLike = { lng: -97.74562898838249, lat: 30.311251794566203 };
const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";

function getMapURL(matches: boolean): string {
    return matches ? "mapbox://styles/mapbox/navigation-night-v1" : DEFAULT_STYLE;
}

function setMapColorScheme(map: mapbox.Map) {
    const mediaList = window.matchMedia("(prefers-color-scheme: dark)");
    map.setStyle(getMapURL(mediaList.matches));

    mediaList.addEventListener("change", {
        handleEvent(event: MediaQueryListEvent) {
            map.setStyle(getMapURL(event.matches));
        },
    });
}

export namespace Map {
    export interface Props {
        token: string;
        branchLngLats: mapbox.LngLatLike[];
        className?: string;
    }
}

export function Map({ token: accessToken, branchLngLats: lngLats, className }: Map.Props) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const map = new MapboxMap({
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

        for (const lngLat of lngLats) {
            const marker = new Marker({ color: "#006288" });
            marker.setLngLat(lngLat);
            marker.addTo(map);
        }

        setMapColorScheme(map);

        return () => map.remove();
    }, [accessToken, lngLats]);

    return <div className={className} ref={container} />;
}
