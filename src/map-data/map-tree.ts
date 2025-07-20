import assert from "../assert";
import { type Rectangle } from "../math/rectangle";
import * as rectangle from "../math/rectangle";

const MAX_IN_NODE = 64;
const MIN_IN_NODE = 2;
const DISTRIBUTION_COUNT = MAX_IN_NODE - 2 * MIN_IN_NODE + 2;

export interface Entry<T> {
    entry: T,
    bound: Rectangle
}

interface Bounded {
    bound: Rectangle
}

interface Leaf<T> extends Bounded {
    isLeaf: true;
    parent: Internal<T> | null;
    items: Entry<T>[];
    bound: Rectangle,
}

interface Internal<T> extends Bounded {
    isLeaf: false;
    parent: Internal<T> | null;
    items: Node<T>[];
    bound: Rectangle,
}

export type Node<T> = Internal<T> | Leaf<T>;

function isLeaf<T>(n: Node<T>): n is Leaf<T> {
    return n.isLeaf;
}

function isInternal<T>(n: Node<T>): n is Internal<T> {
    return !n.isLeaf;
}

const X_AXIS_SELECTOR = [(r: Rectangle) => r.left, (r: Rectangle) => r.right] as const;
const Y_AXIS_SELECTOR = [(r: Rectangle) => r.top, (r: Rectangle) => r.bottom] as const;

export class MapTree<T> {
    root: Node<T> | null = null;

    private adjustTree(node: Node<T>, nodeSplit: Node<T> | undefined) {
        while (node.parent !== null) {
            let parentSplit = undefined;
            node.parent.bound = rectangle.union(node.parent.bound, node.bound);
            if (nodeSplit !== undefined) {
                node.parent.bound = rectangle.union(node.parent.bound, nodeSplit.bound);
                node.parent.items.push(nodeSplit);
                if (node.parent.items.length > MAX_IN_NODE) {
                    parentSplit = split(node.parent);
                }
            }
            node = node.parent;
            nodeSplit = parentSplit;
        }

        if (nodeSplit !== undefined) {
            const newRoot: Internal<T> = {
                isLeaf: false,
                parent: null,
                items: [node, nodeSplit],
                bound: rectangle.union(node.bound, nodeSplit.bound),
            }
            node.parent = newRoot;
            nodeSplit.parent = newRoot;
            this.root = newRoot;
        }
    }

    private insertAtLeaf(node: Node<T>, entry: Entry<T>) {
        const leaf = chooseLeaf(node, entry.bound);
        leaf.items.push(entry);
        leaf.bound = rectangle.union(leaf.bound, entry.bound);
        let leafSplit = undefined;
        if (leaf.items.length > MAX_IN_NODE) {
            leafSplit = split(leaf);
        }
        this.adjustTree(leaf, leafSplit);

    }

    insert(entry: Entry<T>) {
        if (this.root === null) {
            this.root = {
                parent: null,
                isLeaf: true,
                items: [entry],
                bound: entry.bound,
            }
            return;
        }

        this.insertAtLeaf(this.root, entry);

    }

    *search(rect: Rectangle): Generator<Entry<T>, void, void> {
        if (this.root === null)
            return;

        yield* query(this.root, rect);
    }
}

function split<T>(node: Node<T>): Node<T> {
    assert(node.items.length === MAX_IN_NODE + 1);
    // Choose axis
    let chosenSplitEdge: typeof X_AXIS_SELECTOR[0];
    let chosenSplitIndex: number;
    let chosenSplitSemiperimeterSum = Infinity;
    for (const axis of [X_AXIS_SELECTOR, Y_AXIS_SELECTOR]) {
        let semiperimeterSum = 0;
        let distributionArea = Infinity;
        let distributionOverlap = Infinity;
        let distributionEdge: typeof axis[0];
        let distributionIndex: number;

        for (const edge of axis) {
            node.items.sort((a, b) => edge(a.bound) - edge(b.bound));

            const rects = node.items.map(x => x.bound);
            for (let k = 0; k < DISTRIBUTION_COUNT; k++) {
                const region1 = rectangle.unionMany(rects.slice(0, MIN_IN_NODE + k));
                const region2 = rectangle.unionMany(rects.slice(MIN_IN_NODE + k));
                semiperimeterSum += rectangle.semiperimeter(region1) + rectangle.semiperimeter(region2);
                const area = rectangle.area(region1) + rectangle.area(region2);
                const overlap = rectangle.intersectionArea(region1, region2);

                if (overlap < distributionOverlap ||
                    overlap === distributionOverlap && area > distributionArea) {
                    distributionEdge = edge;
                    distributionIndex = MIN_IN_NODE + k;
                    distributionOverlap = overlap;
                    distributionArea = area;
                }
            }
        }

        if (semiperimeterSum < chosenSplitSemiperimeterSum) {
            chosenSplitSemiperimeterSum = semiperimeterSum;
            chosenSplitEdge = distributionEdge!;
            chosenSplitIndex = distributionIndex!;
        }
    }

    // Reproduce result
    node.items.sort((a, b) => chosenSplitEdge(a.bound) - chosenSplitEdge(b.bound));
    const newItems = node.items.splice(chosenSplitIndex!);
    node.bound = rectangle.unionMany(node.items.map(x => x.bound));
    const newBound = rectangle.unionMany(newItems.map(x => x.bound));
    return {
        isLeaf: node.isLeaf,
        parent: node.parent,
        bound: newBound,
        items: newItems,
    } as typeof node;
}

function chooseLeaf<T>(tree: Node<T>, rect: Rectangle): Leaf<T> {
    let node = tree;
    while (!isLeaf(node)) {
        node = chooseSubtree(node, rect);
    }
    return node;
}

const LEAST_P = 32;

// Note: ensure kRect and rects[x].bound reference equality.
function overlap(kRect: Rectangle, rects: Rectangle[]): number {
    let area = 0;

    for (const e of rects) {
        if (kRect !== e) {
            area += rectangle.intersectionArea(e, kRect);
        }
    }

    return area;
}

function chooseSubtree<T>(node: Node<T>, testRect: Rectangle): Node<T> {
    if (!isInternal(node))
        return node;

    if (node.items[0].isLeaf) {
        const leastP = node.items.map(
            x => [x, rectangle.unionArea(x.bound, testRect) - rectangle.area(x.bound)] as const);
        
        leastP.sort((a, b) => a[1] - b[1]);

        if (leastP.length > LEAST_P)
            leastP.splice(LEAST_P);

        const rects = node.items.map(x => x.bound);
        const overlaps = leastP.map(e => overlap(e[0].bound, rects));
        rects.push(testRect);
        const overlapEnlarges = leastP.map((e, i) => overlap(e[0].bound, rects) - overlaps[i]);

        let [leastEntry, leastAreaEnlarge] = leastP.pop()!;
        let leastOverlapEnlarge = overlapEnlarges.pop()!;
        let leastArea = rectangle.area(leastEntry.bound);
        for (const [i, [entry, entryAreaEnlarge]] of leastP.entries()) {
            const entryOverlapEnlarge = overlapEnlarges[i];
            if (entryOverlapEnlarge > leastOverlapEnlarge) 
                continue;
            if (entryOverlapEnlarge === leastOverlapEnlarge && entryAreaEnlarge > leastAreaEnlarge)
                continue;
            const entryArea = rectangle.area(entry.bound);
            if (entryAreaEnlarge === leastAreaEnlarge && entryArea > leastArea)
                continue;
            leastOverlapEnlarge = entryOverlapEnlarge;
            leastAreaEnlarge = entryAreaEnlarge;
            leastArea = entryArea;
            leastEntry = entry;
        }
        return leastEntry;
    } else {
        const enlarges = node.items.map(x => rectangle.unionArea(x.bound, testRect) - rectangle.area(x.bound));
        let lowestEnlarge = enlarges.pop()!;
        let lowestEntry = node.items.at(-1)!;
        for (const [i, currentEnlarge] of enlarges.entries()) {
            // If the enlargement is greater or it's tied but its area is larger, don't choose this.
            if (currentEnlarge > lowestEnlarge)
                continue;
            if (currentEnlarge === lowestEnlarge && rectangle.area(node.items[i].bound) > rectangle.area(lowestEntry.bound))
                continue;

            // Strictly less than or tied and the area is smaller
            lowestEntry = node.items[i];
            lowestEnlarge = currentEnlarge;
        }
        return lowestEntry;
    }
}

function* query<T>(n: Node<T>, rect: Rectangle): Generator<Entry<T>, void, void> {
    if (isInternal(n)) {
        for (const c of n.items) {
            if (rectangle.intersects(c.bound, rect)) {
                yield* query(c, rect);
            }
        }
    } else {
        for (const c of n.items) {
            if (rectangle.intersects(c.bound, rect)) {
                yield c;
            }
        }
    }
}

