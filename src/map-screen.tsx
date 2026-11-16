import { useSignal } from "@preact/signals";
import { Map } from "./components/map/map";
import { Toolbar } from "./components/toolbar";
import { vec2 } from "./math/vector2";

export default function MapScreen() {
    const pos = useSignal(vec2(0, 0));
    
    return (
        <div class="app">
            <Map position={pos} />
            <Toolbar position={pos} />
        </div>
    );
}
