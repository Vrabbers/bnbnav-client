import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import { collectMapData, type JsonMapData } from "./map-data/map-types.ts";
import { MapGraph } from "./map-data/map-graph.ts";



const resp = await fetch("https://bnbnav.aircs.racing/api/data");
const data = collectMapData(await resp.json() as JsonMapData);
console.log(data);
const graph = new MapGraph();
data.nodes.forEach((_v, k) => { graph.insertNode(k) });
data.edges.forEach((v) => { graph.insertEdge(v) });
console.log(graph);


const domMap = document.getElementById("decapitatedCanvas") as HTMLCanvasElement;
const map = new MapRenderer(domMap);
console.log(map);
render(<App />, document.getElementById("root")!);
