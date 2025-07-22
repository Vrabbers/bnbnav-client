import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import { collectMapData, type JsonMapData } from "./map-data/map-types.ts";
import { MapGraph } from "./map-data/map-graph.ts";
import { MapTree } from "./map-data/map-tree.ts";
import { expand, normalize, rect } from "./math/rectangle.ts";


console.time("data download and collect");
const resp = await fetch("https://bnbnav.aircs.racing/api/data");
const data = collectMapData(await resp.json() as JsonMapData);
console.timeEnd("data download and collect");
console.log(data);

console.time("build graph");
const graph = new MapGraph();
data.nodes.forEach((_v, k) => { graph.insertNode(k) });
data.edges.forEach((v) => { graph.insertEdge(v) });
console.timeEnd("build graph");

console.log(graph);

console.time("build tree");
const stuff = [];
for (const [key, value] of data.edges.entries()) {
    const n1 = data.nodes.get(value.node1)!;
    const n2 = data.nodes.get(value.node2)!;
    const bound = normalize(rect(n1.x, n1.z, n2.x, n2.z));
    stuff.push({entry: key, bound: bound});
}
const tree = MapTree.fromItems<string>(stuff);

console.timeEnd("build tree");

const small = [];
const big = [];
for (let i = 0; i < 5000; i++) {
    const x = Math.round(Math.random() * 2000) - 1000;
    const y = Math.round(Math.random() * 2000) - 1000;
    small.push(rect(x, y, x + 100, y + 100));
    big.push(rect(x, y, x + 1000, y + 1000));
}

console.time("small");
for (const r of small) {
    let i = 0;
    for (const q of tree.search(r));
        i++;
}
console.timeEnd("small");

console.time("big");
for (const r of big) {
    let i = 0;
    for (const q of tree.search(r));
        i++;
}
console.timeEnd("big");


const domMap = document.getElementById("decapitatedCanvas") as HTMLCanvasElement;
const map = new MapRenderer(domMap, tree, data);
console.log(map);
render(<App />, document.getElementById("root")!);
