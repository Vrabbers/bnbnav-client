import "./index.css"
import App from './App.tsx'
import { render } from "preact"
import { Map } from "./map/map.ts";

let domMap = document.getElementById("mapCanvas");
if (!(domMap instanceof HTMLCanvasElement)) {
    throw "Couldn't find map canvas!";
}
let map = new Map(domMap);
console.log(map);

render(<App/>, document.getElementById("root")!);