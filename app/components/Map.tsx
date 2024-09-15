import { type LngLatLike, Map as MapboxMap, Marker } from "mapbox-gl";
import { useEffect, useRef } from "react";

const ACCESS_TOKEN = import.meta.env.MAPBOX_TOKEN;

const center: LngLatLike = [-97.68353394771864, 30.28148032602474];

function getMapURL(matches: boolean): string {
    return matches ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12";
}

function mediaListener(map: MapboxMap) {
    return (event: MediaQueryListEvent) => map.setStyle(getMapURL(event.matches));
}

export function Map() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const map = new MapboxMap({
            accessToken: ACCESS_TOKEN,
            container: container.current!,
            style: "mapbox://styles/mapbox/streets-v12",
            center,
            zoom: 14,
            dragPan: true,
            scrollZoom: true,
            attributionControl: false,
        });

        const marker = new Marker({ color: "#4f46e5" });
        marker.setLngLat(center);
        marker.addTo(map);

        const mediaList = window.matchMedia("(prefers-color-scheme: dark)");
        map.setStyle(getMapURL(mediaList.matches));

        const listener = mediaListener(map);
        mediaList.addEventListener("change", listener);

        return () => mediaList.removeEventListener("change", listener);
    }, [container]);

    return <div className="h-52 w-full rounded-md border border-black/25" ref={container} />;
}
