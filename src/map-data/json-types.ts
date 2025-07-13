export type JsonAnnotation = any;
export type JsonLandmark = any;
export interface JsonNode {
    x: number,
    y: number,
    z: number,
    world: string,
}
export interface JsonRoad {
    name: string,
    type: string,
}
export interface JsonEdge {
    road: string,
    node1: string,
    node2: string
}

export interface JsonMapData {
    annotations: {[index: string]: JsonAnnotation},
    landmarks: {[index: string]: JsonLandmark},
    nodes: {[index: string]: JsonNode},
    roads: {[index: string]: JsonRoad},
    edges: {[index: string]: JsonEdge}
}

export interface MapData {
    annotations: Map<string, JsonAnnotation>;
    landmarks: Map<string, JsonLandmark>;
    nodes: Map<string, JsonNode>;
    roads: Map<string, JsonRoad>;
    edges: Map<string, JsonEdge>;
}

export function collectMapData(json: JsonMapData): MapData {
    return {
        annotations: new Map(Object.entries(json.annotations)),
        landmarks: new Map(Object.entries(json.landmarks)),
        nodes: new Map(Object.entries(json.nodes)),
        roads: new Map(Object.entries(json.roads)),
        edges: new Map(Object.entries(json.edges)),
    }
}