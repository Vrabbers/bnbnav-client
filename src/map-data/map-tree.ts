import assert from "../assert";
import { type Rectangle } from "../math/rectangle";
import * as rectangle from "../math/rectangle";
import { distanceSquared } from "../math/vector2";

const MAX_IN_NODE = 64;
const MIN_IN_NODE = 2;
const DISTRIBUTION_COUNT = MAX_IN_NODE - 2 * MIN_IN_NODE + 2;
const REINSERT_P = 20;
const CHOOSE_SUBTREE_P = 32;


export interface Entry<T> {
    entry: T,
    bound: Rectangle
}

interface Leaf<T> {
    isLeaf: true;
    parent: Internal<T> | null;
    items: Entry<T>[];
    bound: Rectangle,
}

interface Internal<T> {
    isLeaf: false;
    parent: Internal<T> | null;
    items: Node<T>[];
    bound: Rectangle,
}

type Node<T> = Internal<T> | Leaf<T>;

type Bounded<T> = Entry<T> | Node<T>

function isEntry<T>(n: Bounded<T>): n is Entry<T> {
    return "entry" in n
}

function isNode<T>(n: Bounded<T>): n is Node<T> {
    return "isLeaf" in n;
}

function isLeaf<T>(n: Node<T>): n is Leaf<T> {
    return n.isLeaf;
}

function isInternal<T>(n: Node<T>): n is Internal<T> {
    return !n.isLeaf;
}

export class MapTree<T> {
    private root: Node<T> | null = null;

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

        const leaf = chooseLeaf(this.root, entry.bound);
        this.insertAt(leaf, entry, true);
    }

    *search(rect: Rectangle): Generator<Entry<T>, void, void> {
        if (this.root === null)
            return;

        yield* query(this.root, rect);
    }

    private insertAt(node: Node<T>, entry: Bounded<T>, first: boolean) {
        if (isLeaf(node)) {
            assert(isEntry(entry));
            node.items.push(entry);
        } else {
            assert(isNode(entry));
            node.items.push(entry);
        }
        node.bound = rectangle.union(node.bound, entry.bound);
        let split = null;
        if (node.items.length > MAX_IN_NODE) {
            split = this.overflowTreatment(node, first);
        }
        this.adjustTree(node, split, first);
    }

    private insertAtLevel(node: Node<T>, entry: Bounded<T>, first: boolean) {
        assert(node.parent !== null);
        const sibling = chooseSubtree(node.parent, entry.bound);
        this.insertAt(sibling, entry, first);
    }

    private overflowTreatment(node: Node<T>, first: boolean): Node<T> | null {
        // If the level is not the root level and this is the first call of overflowTreatment in the given level
        // during the insertion of one data rectangle, then
        assert(node.items.length === MAX_IN_NODE + 1);
        if (node !== this.root && first) {
            // "this is the first call of overflowTreatment in the given level" 
            // is guaranteed by reinsert calling insertAtLevel with false
            this.reinsert(node);
            return null;
        } else {
            return split(node);
        }
    }

    private reinsert(node: Node<T>) {
        assert(node.items.length === MAX_IN_NODE + 1);
        // RI1: For all M + 1 entries of a node N, compute the distance between the centers of their rectangles and the
        // center of the bounding rectangle of N
        const nodeCenter = rectangle.center(node.bound);
        const distances = node.items.map(x => [x, distanceSquared(nodeCenter, rectangle.center(x.bound))] as const);

        // RI2: Sort the entries in *increasing order of their distances
        distances.sort((a, b) => a[1] - b[1]);

        // RI3: Remove *last p entries from N and adjust the bounding rectangle of N
        const entriesSorted = distances.map(x => x[0]) as typeof node.items;
        const removed = entriesSorted.splice(REINSERT_P);
        const newBound = rectangle.unionMany(entriesSorted.map(x => x.bound));
        node.items = entriesSorted;
        node.bound = newBound;
        adjustTreeBounds(node);

        // RI4: In the sort defined in RI2, starting with with the minimum distance (Close reinsert), invoke insert to
        // reinsert the entries
        for (const rem of removed) {
            this.insertAtLevel(node, rem, false);
        }
    }

    private adjustTree(node: Node<T>, nodeSplit: Node<T> | null, first: boolean) {
        while (node.parent !== null) {
            let parentSplit = null;
            node.parent.bound = rectangle.union(node.parent.bound, node.bound);
            if (nodeSplit !== null) {
                node.parent.bound = rectangle.union(node.parent.bound, nodeSplit.bound);
                node.parent.items.push(nodeSplit);
                if (node.parent.items.length > MAX_IN_NODE) {
                    parentSplit = this.overflowTreatment(node.parent, first);
                }
            }
            node = node.parent;
            nodeSplit = parentSplit;
        }

        if (nodeSplit !== null) {
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
}

const X_AXIS_SELECTOR = [(r: Rectangle) => r.left, (r: Rectangle) => r.right] as const;
const Y_AXIS_SELECTOR = [(r: Rectangle) => r.top, (r: Rectangle) => r.bottom] as const;

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

function adjustTreeBounds<T>(node: Node<T>) {
    while (node.parent !== null) {
        node.parent.bound = rectangle.union(node.parent.bound, node.bound);
        node = node.parent;
    }
}

function chooseLeaf<T>(tree: Node<T>, rect: Rectangle): Leaf<T> {
    let node = tree;
    while (!isLeaf(node)) {
        node = chooseSubtree(node, rect);
    }
    return node;
}

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

        if (leastP.length > CHOOSE_SUBTREE_P)
            leastP.splice(CHOOSE_SUBTREE_P);

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

