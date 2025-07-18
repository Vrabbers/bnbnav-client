import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import { collectMapData, type EdgeId, type JsonMapData } from "./map-data/map-types.ts";
import { MapGraph } from "./map-data/map-graph.ts";
import { MapTree } from "./map-data/map-tree.ts";
import { normalize, rect } from "./math/rectangle.ts";



const resp = await fetch("https://bnbnav.aircs.racing/api/data");
const data = collectMapData(await resp.json() as JsonMapData);
console.log(data);
const graph = new MapGraph();
data.nodes.forEach((_v, k) => { graph.insertNode(k) });
data.edges.forEach((v) => { graph.insertEdge(v) });
console.log(graph);
const tree = new MapTree<EdgeId>();
for (const [key, value] of data.edges.entries()) {
    const n1 = data.nodes.get(value.node1)!;
    const n2 = data.nodes.get(value.node2)!;
    if (n1.world === "world") continue;
    if (n2.world === "world") continue;
    const bound = normalize(rect(n1.x, n1.z, n2.x, n2.z));
    tree.insert({entry: key, bound: bound});
}


const domMap = document.getElementById("decapitatedCanvas") as HTMLCanvasElement;
const map = new MapRenderer(domMap, tree);
console.log(map);
render(<App />, document.getElementById("root")!);
