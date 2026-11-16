import { MapServiceContext } from "../map-data/map-service-context.ts";
import { MapRenderer } from "./map-renderer.ts";
import { useContext, useEffect, useRef } from "preact/hooks";
import "./map.css";

export function MapCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mapRendererRef = useRef<MapRenderer | null>(null);
    const mapService = useContext(MapServiceContext);

    useEffect(() => {
        if (canvasRef.current !== null) {
            const renderer = new MapRenderer(canvasRef.current, mapService);
            mapRendererRef.current = renderer;
            
            return () => { renderer.dispose() };
        }
    }, [mapService]);

    return (
        <canvas ref={canvasRef} class="mapCanvas">
            Canvas support is required.
        </canvas>
    );
}
