import "./index.css"
import App from './App.tsx'
import { render } from "preact"
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import { collectMapData } from "./map-data/json-types.ts";

let domMap = document.getElementById("decapitatedCanvas");
if (!(domMap instanceof HTMLCanvasElement)) {
    throw new Error("Couldn't find map canvas!");
}

let x = await fetch("https://bnbnav.aircs.racing/api/data");
const data = await x.json();
console.log(data);

let map = new MapRenderer(domMap, collectMapData(data));
console.log(map);

render(<App/>, document.getElementById("root")!);
