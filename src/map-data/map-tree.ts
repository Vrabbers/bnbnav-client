// Implements a R*-tree to store the edges for quick rectangular queries and NN searches taken from the paper

import { Rect } from "../math/rect";

const MAX_PER_NODE = 128;
const MIN_PER_NODE = Math.round(0.4 * MAX_PER_NODE); // Suggested in the paper for point queries. Test for rectangles?
const DISTRIB_COUNT = MAX_PER_NODE - 2 * MIN_PER_NODE + 2;
const LEAST_P = 32;

type EdgeId = string;

interface BoundedEntry<T> {
    entry: T;
    rect: Rect;
}

interface Leaf {
    type: "leaf";
    items: BoundedEntry<EdgeId>[];
}

interface NonLeaf {
    type: "non-leaf";
    items: BoundedEntry<Node>[];
}

export type Node = Leaf | NonLeaf;

function chooseSubtree(tree: Node, testRect: Rect): Leaf {
    let node = tree;
    while (node.type !== "leaf") {
        if (node.items[0].entry.type === "leaf") {
            // Determine _nearly_ minimum overlap cost.
            const leastP = node.items.map<[BoundedEntry<Node>, number]>(
                (x) => [x, Rect.union(x.rect, testRect).area - x.rect.area]
            );
            leastP.sort((a, b) => a[1] - b[1]);
            if (leastP.length > LEAST_P) leastP.length = LEAST_P;

            // Find element with least overlap
            // HACK: this implementation is from a C++ one, in which the function suggested in the paper is simplified
            // The papers' implementation requires iterating through all of the rectangles for each overlap calculation;
            // we'll see if the tree which this produces is good enough.
            let [lowestEntry, lowestEnlarge] = leastP.pop()!;
            let lowestOverlap = Rect.intersectArea(lowestEntry.rect, testRect);
            for (const [currentEntry, currentEnlarge] of leastP) {
                const currentOverlap = Rect.intersectArea(currentEntry.rect, testRect);
                // If the overlap is greater, or it's tied but its enlargement is larger, don't choose this
                if (currentOverlap > lowestOverlap) continue;
                if (currentOverlap === lowestOverlap && currentEnlarge > lowestEnlarge) continue;

                // Strictly less than, or tied and the enlarge is smaller
                lowestEntry = currentEntry;
                lowestEnlarge = currentEnlarge;
                lowestOverlap = currentOverlap;
            }
            node = lowestEntry.entry;
            console.assert(node.type === "leaf");
        } else {
            // children are not leaves
            // Determine minimum area cost
            const enlarges = node.items.map((x) => Rect.union(x.rect, testRect).area - x.rect.area);
            let lowestEnlarge = enlarges.pop()!;
            let lowestEntry = node.items.at(-1)!;
            for (const [i, currentEnlarge] of enlarges.entries()) {
                // If the enlargement is greater or it's tied but its area is larger, don't choose this.
                if (currentEnlarge > lowestEnlarge) continue;
                if (currentEnlarge === lowestEnlarge && node.items[i].rect.area > lowestEntry.rect.area) continue;

                // Strictly less than or tied and the area is smaller
                lowestEntry = node.items[i];
                lowestEnlarge = currentEnlarge;
            }
        }
    }
    return node;
}

type EdgeSelector = (r: Rect) => number;
type AxisSelector = readonly [EdgeSelector, EdgeSelector];

const X_AXIS_SELECTOR: AxisSelector = [(r: Rect) => r.left, (r: Rect) => r.right];
const Y_AXIS_SELECTOR: AxisSelector = [(r: Rect) => r.top, (r: Rect) => r.bottom];
const AXIS_SELECTORS: readonly AxisSelector[] = [X_AXIS_SELECTOR, Y_AXIS_SELECTOR];

function split(node: BoundedEntry<Node>): BoundedEntry<Node> {
    console.assert(node.entry.items.length === MAX_PER_NODE + 1);
    const nodeEntries = [...node.entry.items];
    let splitEdge: EdgeSelector, splitIndex: number;
    let splitMargin = Infinity;
    for (const axis of AXIS_SELECTORS) {
        let margin = 0;
        let distArea = Infinity, distOverlap = Infinity;
        let distEdge: EdgeSelector;
        let distIndex: number;

        for (const edge of axis) {
            nodeEntries.sort((a, b) => edge(a.rect) - edge(b.rect));

            for (let k = 0; k < DISTRIB_COUNT; k++) {
                const r1 = Rect.unionMany(nodeEntries.slice(0, MIN_PER_NODE + k).map(x => x.rect));
                const r2 = Rect.unionMany(nodeEntries.slice(MIN_PER_NODE + k, -1).map(x => x.rect));
                margin += r1.semiperimeter + r2.semiperimeter;
                const area = r1.area + r2.area;
                const overlap = Rect.intersectArea(r1, r2);

                if (overlap < distOverlap) continue;
                if (overlap === distOverlap && area < distArea) continue;

                distEdge = edge;
                distIndex = MIN_PER_NODE + k;
                distOverlap = overlap;
                distArea = area;
            }
        }

        if (margin < splitMargin) {
            splitMargin = margin;
            splitEdge = distEdge!;
            splitIndex = distIndex!;
        }
    }

    node.entry.items.sort((a, b) => splitEdge(a.rect) - splitEdge(b.rect));
    const newNodeItems = node.entry.items.splice(splitIndex!);
    node.rect = Rect.unionMany(node.entry.items.map(x => x.rect));
    const newNodeRect = Rect.unionMany(newNodeItems.map(x => x.rect));

    return {
        entry: {
            type: node.entry.type,
            items: newNodeItems,
        } as Node, 
        // Typescript complains since it cannot see that the constructed type is valid; the `as Node` shuts it up.
        rect: newNodeRect
    }

}


export const MapTree = {

};
