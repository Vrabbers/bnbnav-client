import "./index.css";
import App from "./App.tsx";
import { render } from "preact";
import { MapRenderer } from "./map-renderer/map-renderer.ts";
import RStarTree from "./map-data/r-star-tree.ts";
import { collectMapData, type JsonMapData } from "./map-data/json-types.ts";
import { Rect } from "./math/rect.ts";

const domMap = document.getElementById("decapitatedCanvas");
if (!(domMap instanceof HTMLCanvasElement)) {
    throw new Error("Couldn't find map canvas!");
}


const tree = new RStarTree();
const data = await fetch("https://bnbnav.aircs.racing/api/data");
const json = await data.json() as JsonMapData;
const mapd = collectMapData(json);
for (const [key, val] of mapd.edges.entries()) {
    const node1 = mapd.nodes.get(val.node1)!;
    const node2 = mapd.nodes.get(val.node2)!;
    tree.insert({entry: key, rect: Rect.fromEdges(node1.x, node1.z, node2.x, node2.z).normalize()});
}

console.log(tree);

const map = new MapRenderer(domMap, tree);
console.log(map);

render(<App />, document.getElementById("root")!);
