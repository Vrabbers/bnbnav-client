import { useEffect, useErrorBoundary, useState } from "preact/hooks";
import { MapService } from "./map-service/map-service.ts";
import { Map } from "./components/map/map.tsx";
import { MapServiceContext } from "./map-service/map-service-context.ts";
import "./app.css";
import logo from "./assets/logo.svg";
import { Toolbar } from "./components/toolbar.tsx";
import { useTranslation } from "react-i18next";

export default function App() {
    const { t } = useTranslation();
    const [mapService, setMapService] = useState<MapService | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [connectionStateMessage, setConnectionStateMessage] =
        useState("CONNECTING");

    useErrorBoundary((e) => setError(e));

    useEffect(() => {
        window.addEventListener("error", (e) => {
            setError(e);
        });

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
                {t("PAGE_ERROR")}
                <button
                    onClick={() => {
                        location.reload();
                    }}
                >
                    {t("PAGE_RELOAD")}
                </button>
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
                <p>{t("LOADING_" + connectionStateMessage)}</p>
            </div>
        );
    }
}
