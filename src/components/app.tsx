import { useEffect, useState } from "preact/hooks";
import { MapService } from "../map-service/map-service.ts";
import { Map } from "./map/map.tsx";
import { MapServiceContext } from "../map-service/map-service-context.ts";
import "./app.css";
import logo from "./assets/logo.svg";
import { Toolbar } from "./toolbar.tsx";

export default function App() {
    const [mapService, setMapService] = useState<MapService | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [connectionStateMessage, setConnectionStateMessage] = useState("CONNECTING");
    useEffect(() => {
        MapService.connect(setError, setConnectionStateMessage).then(
            setMapService,
            (e: unknown) => {
                console.error("Error connecting to MapService: ", e);
                setError(e);
            },
        );
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
                    <Map />
                    <Toolbar />
                </div>
            </MapServiceContext>
        );
    } else {
        return (
            <div class="app info">
                <img width="150" src={logo} alt="bnbnav logo" />
                <progress />
                <p>
                    {(() => {
                        switch (connectionStateMessage) {
                            case "CONNECTING":
                                return "Connecting to bnbnav...";
                            case "DOWNLOADING":
                                return "Downloading map data...";
                            case "WORKING":
                                return "Reticulating splines...";
                        }
                    })()}
                </p>
            </div>
        );
    }
}
