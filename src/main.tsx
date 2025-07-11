import "./index.css"
import App from './App.tsx'
import { render } from "preact"
import { MapCanvas } from "./map/mapCanvas.ts";

let domMap = document.getElementById("decapitatedCanvas");
if (!(domMap instanceof HTMLCanvasElement)) {
    throw "Couldn't find map canvas!";
}
let map = new MapCanvas(domMap);
console.log(map);

render(<App/>, document.getElementById("root")!);