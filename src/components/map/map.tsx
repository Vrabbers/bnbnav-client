import { MapCanvas } from "./map-canvas";

export function Map() {
    return (
        <div class="mapContainer">
            <button style={{ position: "absolute" }}>G</button>
            <MapCanvas />
        </div>
    );
}