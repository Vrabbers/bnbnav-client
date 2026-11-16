export type JsonAnnotation = object;
export type JsonLandmark = object;

export interface JsonMapNode {
    x: number;
    y: number;
    z: number;
    world: string;
}

export interface JsonRoad {
    name: string;
    type: string;
}

export interface JsonEdge {
    road: string;
    node1: string;
    node2: string;
}

export interface JsonMapData {
    annotations: Record<string, JsonAnnotation>;
    landmarks: Record<string, JsonLandmark>;
    nodes: Record<string, JsonMapNode>;
    roads: Record<string, JsonRoad>;
    edges: Record<string, JsonEdge>;
}
