import { createContext } from "preact";
import type { MapService } from "./map-service";

export const MapServiceContext = createContext<MapService>(undefined!);
