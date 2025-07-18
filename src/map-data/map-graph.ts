import type { Edge, NodeId, RoadId } from "./map-types";

interface ListEntry { 
    node: NodeId;
    via: RoadId;
}

export class MapGraph {
    private readonly adjacencies = new Map<string, ListEntry[] | null>();

    insertNode(nodeId: string) {
        this.adjacencies.set(nodeId, null);
    }

    insertEdge(edge: Edge) {
        let list = this.adjacencies.get(edge.node1);
        if (list === undefined) {
            throw new Error("Edge's parting node does not exist in graph");
        }
        list ??= [];
        if (!this.adjacencies.has(edge.node2)) {
            throw new Error("Edge's destination node does not exist in graph");
        }
        list.push({ node: edge.node2, via: edge.road });

        this.adjacencies.set(edge.node1, list);
    }
}
