// Implements a R*-tree to store the edges for quick rectangular queries and NN searches taken from the paper

import { Rect } from "../math/rect";
import { Vector2 } from "../math/vector2";

const MAX_PER_NODE = 64;
const MIN_PER_NODE = Math.round(0.4 * MAX_PER_NODE); // Suggested in the paper.
const DISTRIB_COUNT = MAX_PER_NODE - 2 * MIN_PER_NODE + 2;
const LEAST_P = 32;
const REINSERT_P = Math.round(0.3 * MAX_PER_NODE);

export interface Bounded {
    rect: Rect;
}

export interface BoundedEntry<T> extends Bounded {
    entry: T;
}

export interface Leaf<T> extends Bounded {
    type: "leaf";
    items: BoundedEntry<T>[];
}

export interface NonLeaf<T> extends Bounded {
    type: "non-leaf";
    items: Node<T>[];
}

export type Node<T> = Leaf<T> | NonLeaf<T>;

function chooseSubtree<T>(node: Node<T>, testRect: Rect): Node<T> {
    if (node.type === "leaf")
        return node;

    if (node.items[0].type === "leaf") {
        // Determine _nearly_ minimum overlap cost.
        const leastP = node.items.map<[Node<T>, number]>(
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
        return lowestEntry;
    } else {
        // children are not leaves
        // Determine minimum area cost
        const enlarges = node.items.map((x) => Rect.union(x.rect, testRect).area - x.rect.area);
        let lowestEnlarge = enlarges.pop()!;
        let lowestEntry = node.items.at(-1)!;
        for (const [i, currentEnlarge] of enlarges.entries()) {
            // If the enlargement is greater or it's tied but its area is larger, don't choose this.
            if (currentEnlarge > lowestEnlarge)
                continue;
            if (currentEnlarge === lowestEnlarge && node.items[i].rect.area > lowestEntry.rect.area)
                continue;

            // Strictly less than or tied and the area is smaller
            lowestEntry = node.items[i];
            lowestEnlarge = currentEnlarge;
        }
        return lowestEntry;
    }
}

type EdgeSelector = (r: Rect) => number;
type AxisSelector = readonly [EdgeSelector, EdgeSelector];

const X_AXIS_SELECTOR: AxisSelector = [(r: Rect) => r.left, (r: Rect) => r.right];
const Y_AXIS_SELECTOR: AxisSelector = [(r: Rect) => r.top, (r: Rect) => r.bottom];
const AXIS_SELECTORS: readonly AxisSelector[] = [X_AXIS_SELECTOR, Y_AXIS_SELECTOR];

function split<T>(node: Node<T>): Node<T> {
    console.assert(node.items.length === MAX_PER_NODE + 1);
    const nodeEntries = [...node.items];
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

                if (overlap > distOverlap) continue;
                if (overlap === distOverlap && area > distArea) continue;

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

    node.items.sort((a, b) => splitEdge(a.rect) - splitEdge(b.rect));
    const newNodeItems = node.items.splice(splitIndex!);
    node.rect = Rect.unionMany(node.items.map(x => x.rect));
    const newNodeRect = Rect.unionMany(newNodeItems.map(x => x.rect));

    return {
        type: node.type,
        items: newNodeItems,
        rect: newNodeRect
    } as Node<T>; // HACK: Making the TS type-checker happy.
}


export default class RStarTree<T> {
    root: Node<T> | null = null;
    size = 0;

    private reinsert(node: Node<T>) {
        console.assert(node.items.length === MAX_PER_NODE + 1);
        const nodeCenter = node.rect.center;
        node.items.sort((a, b) => 
            Vector2.distance(a.rect.center, nodeCenter) - Vector2.distance(b.rect.center, nodeCenter));
        node.items.reverse();
        const removed = node.items.splice(REINSERT_P);
        node.rect = Rect.unionMany(node.items.map(x => x.rect));
        for (const item of removed) {
            console.assert("entry" in item);
            this.insertImpl(this.root!, item as BoundedEntry<T>, false);
        }
    }

    private overflowTreatment(node: Node<T>, first: boolean) {
        if (node !== this.root && first) {
            this.reinsert(node);
            return null;
        }
        const splitItem = split(node);
        if (node === this.root) {
            this.root = {
                type: "non-leaf",
                items: [node, splitItem],
                rect: Rect.union(node.rect, splitItem.rect),
            };
            return null;
        }
        return splitItem;
    }

    private insertImpl(node: Node<T>, el: BoundedEntry<T>, first: boolean) {
        node.rect = Rect.union(node.rect, el.rect);

        if (node.type === "leaf") {
            node.items.push(el);
        } else {
            const split = this.insertImpl(chooseSubtree(node, el.rect), el, first);

            if (split === null)
                return null;
            node.items.push(split);
        }

        if (node.items.length > MAX_PER_NODE) {
            return this.overflowTreatment(node, first);
        }

        return null;
    }

    insert(el: BoundedEntry<T>) {
        if (this.root === null) {
            this.root = {
                type: "leaf",
                items: [el],
                rect: el.rect
            }
        } else {
            this.insertImpl(this.root, el, true);
        }
        this.size++;
    }
};
