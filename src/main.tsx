import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";

const domMap = document.getElementById("decapitatedCanvas");
if (!(domMap instanceof HTMLCanvasElement)) {
    throw new Error("Couldn't find map canvas!");
}

const map = new MapRenderer(domMap);
console.log(map);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(<App />, document.getElementById("root")!);
