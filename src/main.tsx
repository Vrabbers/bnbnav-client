import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";

const domMap = document.getElementById("decapitatedCanvas") as HTMLCanvasElement;
const map = new MapRenderer(domMap, null);
console.log(map);
render(<App />, document.getElementById("root")!);
