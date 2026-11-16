import { useContext, useEffect, useRef } from "preact/hooks";
import { MapRenderer } from "./map-renderer.ts";
import { MapServiceContext } from "../../map-service/map-service-context";
import type { Signal } from "@preact/signals";
import type { Vector2 } from "../../math/vector2.ts";
import "./map.css";

export function Map({ position }: { position: Signal<Vector2> }) {
    return (
        <div class="mapContainer">
            <button style={{ position: "absolute" }}>G</button>
            <MapCanvas position={position} />
        </div>
    );
}

export function MapCanvas({ position }: { position: Signal<Vector2> }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapRendererRef = useRef<MapRenderer | null>(null);
    const mapService = useContext(MapServiceContext);

    useEffect(() => {
        if (!canvasRef.current) return;

        const renderer = new MapRenderer(
            canvasRef.current,
            mapService,
            (center) => { position.value = center; },
        );
        mapRendererRef.current = renderer;

        return () => {
            mapRendererRef.current = null;
            renderer.dispose();
        };
    }, [mapService, position]);

    return (
        <canvas ref={canvasRef} class="mapCanvas">
            Canvas support is required.
        </canvas>
    );
}
