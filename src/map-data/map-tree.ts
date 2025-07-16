// Implements a R*-tree to store the edges for quick rectangular queries and NN searches taken from the paper

import { Rect } from "../math/rect";

const MAX_PER_NODE = 128;
const MIN_PER_NODE = Math.round(0.4 * MAX_PER_NODE); // Suggested in the paper for point queries. Test for rectangles?
const LEAST_P = 32;

type EdgeId = string;

interface BoundedEntry<T> {
    item: T;
    rect: Rect;
}

interface Leaf {
    type: "leaf";
    entries: BoundedEntry<EdgeId>[];
}

interface NonLeaf {
    type: "non-leaf";
    entries: BoundedEntry<Node>[];
}

export type Node = Leaf | NonLeaf;

export const MapTree = {
    chooseSubtree(tree: Node, testRect: Rect): Leaf {
        let node = tree;
        while (node.type !== "leaf") {
            if (node.entries[0].item.type === "leaf") {
                // Determine _nearly_ minimum overlap cost.
                const leastP = node.entries.map<[BoundedEntry<Node>, number]>(
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
                node = lowestEntry.item;
                console.assert(node.type === "leaf");
            } else {
                // children are not leaves
                // Determine minimum area cost
                const enlarges = node.entries.map((x) => Rect.union(x.rect, testRect).area - x.rect.area);
                let lowestEnlarge = enlarges.pop()!;
                let lowestEntry = node.entries.at(-1)!;
                for (const [i, currentEnlarge] of enlarges.entries()) {
                    // If the enlargement is greater or it's tied but its area is larger, don't choose this.
                    if (currentEnlarge > lowestEnlarge) continue;
                    if (currentEnlarge === lowestEnlarge && node.entries[i].rect.area > lowestEntry.rect.area) continue;

                    // Strictly less than or tied and the area is smaller
                    lowestEntry = node.entries[i];
                    lowestEnlarge = currentEnlarge;
                }
            }
        }
        return node;
    },
};
