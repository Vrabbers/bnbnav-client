import { useEffect, useState } from "preact/hooks";
import { Bar } from "./Bar.tsx";
import { MapService } from "./map-data/map-service.ts";
import { MapContainer } from "./map-renderer/map-container.tsx";
import { MapServiceContext } from "./map-data/map-service.ts";

export default function App() {
    const [mapService, setMapService] = useState<MapService | null>(null);
    const [error, setError] = useState<unknown>(null);
    useEffect(() => {
        MapService.connect(setError).then(setMapService, (e: unknown) => {
            console.error("Error connecting to MapService: ", e);
            setError(e);
        });
    }, []);

    if (error !== null) {
        return (
            <div class="app info">
                An error has occured. Please reload the page.
            </div>
        );
    } else if (mapService !== null) {
        return (
            <MapServiceContext value={mapService}>
                <div class="app">
                    <MapContainer />
                    <Bar />
                </div>
            </MapServiceContext>
        );
    } else {
        return (
            <div class="app info">
                <span>Connecting to bnbnav...</span>
                <progress />
            </div>
        );
    }
}
