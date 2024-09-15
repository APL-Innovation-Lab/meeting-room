import * as mapbox from "mapbox-gl";
import { useEffect, useRef } from "react";
const { Map: MapboxMap, Marker } = mapbox;

const center: mapbox.LngLatLike = [-97.68353394771864, 30.28148032602474];

function getMapURL(matches: boolean): string {
    return matches ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v12";
}

function mediaListener(map: mapbox.Map) {
    return (event: MediaQueryListEvent) => map.setStyle(getMapURL(event.matches));
}

export namespace Map {
    export interface Props {
        token: string;
        branchLngLats: mapbox.LngLatLike[];
    }
}

export function Map({ token: accessToken, branchLngLats: lngLats }: Map.Props) {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const map = new MapboxMap({
            accessToken,
            container: container.current!,
            style: "mapbox://styles/mapbox/light-v11",
            center,
            zoom: 14,
            dragPan: true,
            scrollZoom: true,
            attributionControl: false,
        });

        for (const lngLat of lngLats) {
            const marker = new Marker({ color: "#006288" });
            marker.setLngLat(lngLat);
            marker.addTo(map);
        }

        const mediaList = window.matchMedia("(prefers-color-scheme: dark)");
        map.setStyle(getMapURL(mediaList.matches));

        const listener = mediaListener(map);
        mediaList.addEventListener("change", listener);

        return () => {
            mediaList.removeEventListener("change", listener);
            map.remove();
        };
    }, [accessToken, lngLats]);

    return <div className="w-full h-full rounded-md" ref={container} />;
}
