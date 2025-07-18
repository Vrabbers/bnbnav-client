export type Annotation = object;
export type Landmark = object;

export interface Node {
    x: number;
    y: number;
    z: number;
    world: string;
}

export type NodeId = string;

export interface Road {
    name: string;
    type: string;
}

export type RoadId = string;

export interface Edge {
    road: string;
    node1: string;
    node2: string;
}

export type EdgeId = string;

export interface JsonMapData {
    annotations: Record<string, Annotation>;
    landmarks: Record<string, Landmark>;
    nodes: Record<NodeId, Node>;
    roads: Record<RoadId, Road>;
    edges: Record<EdgeId, Edge>;
}

export interface MapData {
    annotations: Map<string, Annotation>;
    landmarks: Map<string, Landmark>;
    nodes: Map<NodeId, Node>;
    roads: Map<RoadId, Road>;
    edges: Map<EdgeId, Edge>;
}

export function collectMapData(json: JsonMapData): MapData {
    return {
        annotations: new Map(Object.entries(json.annotations)),
        landmarks: new Map(Object.entries(json.landmarks)),
        nodes: new Map(Object.entries(json.nodes)),
        roads: new Map(Object.entries(json.roads)),
        edges: new Map(Object.entries(json.edges)),
    };
}
