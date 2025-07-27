
export type MapNodeId = string;
export type EdgeId = string;
export type RoadId = string;

export interface MapNode {
    id: MapNodeId;
    x: number;
    y: number;
    z: number;
    world: string;
    adjacencies: EdgeId[] | null;
}

