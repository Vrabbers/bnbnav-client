import { createContext } from "preact";
import { rect, rectNormalize } from "../math/rectangle";
import type { JsonMapData } from "./map-json-data";
import { MapTree } from "./map-tree";

export const MapServiceContext = createContext<MapService>(undefined!);

export type MapNodeId = string;
export type EdgeId = string;
export type RoadId = string;

const BASE_URL = "https://bnbnav.aircs.racing/";
const WS_URL = new URL("/ws", BASE_URL);
const DATA_URL = new URL("/api/data", BASE_URL);

export interface MapNode {
    id: MapNodeId;
    x: number;
    y: number;
    z: number;
    world: string;
    adjacent: EdgeId[];
}

export interface Edge {
    id: EdgeId;
    node1: MapNodeId;
    node2: MapNodeId;
    road: RoadId;
}

export interface Road {
    id: RoadId;
    name: string;
    type: string;
}

export class MapService {
    nodes = new Map<MapNodeId, MapNode>();
    edges = new Map<EdgeId, Edge>();
    roads = new Map<RoadId, Road>();
    edgeTree: MapTree<EdgeId>;
    ws: WebSocket;

    private constructor(jsonData: JsonMapData, ws: WebSocket) {
        for (const [id, road] of Object.entries(jsonData.roads)) {
            this.roads.set(id, { id: id, ...road });
        }
        for (const [id, node] of Object.entries(jsonData.nodes)) {
            this.nodes.set(id, { id: id, adjacent: [], ...node });
        }
        const edges = [];
        for (const [id, edge] of Object.entries(jsonData.edges)) {
            this.edges.set(id, { id: id, ...edge });
            const n1 = this.nodes.get(edge.node1)!;
            const n2 = this.nodes.get(edge.node2)!;
            this.nodes.get(edge.node1)!.adjacent.push(id);
            edges.push({
                entry: id,
                bound: rectNormalize(rect(n1.x, n1.z, n2.x, n2.z)),
            });
        }
        this.edgeTree = MapTree.fromItems(edges);
        this.ws = ws;
    }

    static async connect(
        setErrorCallback: (e: unknown) => void,
    ): Promise<MapService> {
        const ws = new WebSocket(WS_URL);
        ws.addEventListener("message", console.log);
        return new Promise((resolve, reject) => {
            ws.addEventListener("error", (a) => {
                console.error(a);
                setErrorCallback(a);
                reject(new Error());
            });

            ws.addEventListener("open", () => {
                console.log("WS connected");
                resolve(
                    (async () => {
                        const req = await fetch(DATA_URL);
                        const json = (await req.json()) as JsonMapData;
                        console.log("JSON downloaded");
                        return new MapService(json, ws);
                    })(),
                );
            });
        });
    }
}
