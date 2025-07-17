import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import { type JsonMapData } from "./map-data/json-types.ts";

const domMap = document.getElementById("decapitatedCanvas");

if (!(domMap instanceof HTMLCanvasElement)) {
    throw new Error("Couldn't find map canvas!");
}

/*
const data = await fetch("https://bnbnav.aircs.racing/api/data");
const json = await data.json() as JsonMapData;

*/
const map = new MapRenderer(domMap);
console.log(map);
render(<App />, document.getElementById("root")!);
