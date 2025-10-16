import { MapServiceContext } from "../map-data/map-service.ts";
import { MapRenderer } from "./map-renderer.ts";
import { useContext, useEffect, useRef, useState } from "preact/hooks";

export function MapContainer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mapRenderer, setMapRenderer] = useState<MapRenderer | null>(null);
    const mapService = useContext(MapServiceContext);

    useEffect(() => {
        if (canvasRef.current !== null) {
            const m = new MapRenderer(canvasRef.current, mapService);
            setMapRenderer(m);
        }
    }, []);

    useEffect(() => {
        if (canvasRef.current !== null) {
            mapRenderer?.setCanvas(canvasRef.current);
        }
    }, [canvasRef.current]);

    return (
        <div class="mapContainer">
            <canvas ref={canvasRef} class="mapCanvas">
                Canvas support is required.
            </canvas>
        </div>
    );
}
