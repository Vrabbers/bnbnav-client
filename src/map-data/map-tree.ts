import assert from "../assert";
import {
    rectArea,
    rectAreaOfIntersection,
    rectAreaOfUnion,
    rectCenter,
    rectSemiperimeter,
    rectTestIntersects,
    rectUnion,
    rectUnionMany,
    type Rectangle,
} from "../math/rectangle";
import { vec2DistanceSquared } from "../math/vector2";

const MAX_IN_NODE = 32;
const MIN_IN_NODE = 2;
const DISTRIBUTION_COUNT = MAX_IN_NODE - 2 * MIN_IN_NODE + 2;
const REINSERT_P = 20;
const CHOOSE_SUBTREE_P = 32;

export interface Entry<T> {
    bound: Rectangle;
    entry: T;
}

interface Leaf<T> {
    isLeaf: true;
    parent: Internal<T> | null;
    items: Entry<T>[];
    bound: Rectangle;
}

interface Internal<T> {
    isLeaf: false;
    parent: Internal<T> | null;
    items: TreeNode<T>[];
    bound: Rectangle;
}

type TreeNode<T> = Internal<T> | Leaf<T>;

type Bounded<T> = Entry<T> | TreeNode<T>;

function isEntry<T>(n: Bounded<T>): n is Entry<T> {
    return "entry" in n;
}

function isNode<T>(n: Bounded<T>): n is TreeNode<T> {
    return "isLeaf" in n;
}

function isLeaf<T>(n: TreeNode<T>): n is Leaf<T> {
    return n.isLeaf;
}

function isInternal<T>(n: TreeNode<T>): n is Internal<T> {
    return !n.isLeaf;
}

export class MapTree<T> {
    private root: TreeNode<T> | null = null;

    static fromItems<T>(entries: Entry<T>[]): MapTree<T> {
        const tree = new MapTree<T>();
        tree.root = bulkInsert<T>(entries);
        return tree;
    }

    insert(entry: T, bound: Rectangle) {
        if (this.root === null) {
            this.root = {
                parent: null,
                isLeaf: true,
                items: [{ entry, bound }],
                bound: bound,
            };
        } else {
            const leaf = chooseLeaf(this.root, bound);
            this.insertAt(leaf, { entry, bound }, true);
        }
    }

    *search(rect: Rectangle): Generator<Entry<T>, void, void> {
        if (this.root === null) return;

        yield* query(this.root, rect);
    }

    private insertAt(node: TreeNode<T>, entry: Bounded<T>, first: boolean) {
        if (isLeaf(node)) {
            assert(isEntry(entry));
            node.items.push(entry);
        } else {
            assert(isNode(entry));
            node.items.push(entry);
        }
        node.bound = rectUnion(node.bound, entry.bound);
        let split = null;
        if (node.items.length > MAX_IN_NODE) {
            split = this.overflowTreatment(node, first);
        }
        this.adjustTree(node, split, first);
    }

    private insertAtLevel(
        node: TreeNode<T>,
        entry: Bounded<T>,
        first: boolean,
    ) {
        assert(node.parent !== null && this.root !== null);
        let movingUp = node;
        let movingDown = this.root;
        while (movingUp.parent !== null) {
            movingUp = movingUp.parent;
            movingDown = chooseSubtree(movingDown, entry.bound); // Moves up
        }
        this.insertAt(movingDown, entry, first);
    }

    private overflowTreatment(
        node: TreeNode<T>,
        first: boolean,
    ): TreeNode<T> | null {
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

    private reinsert(node: TreeNode<T>) {
        assert(node.items.length === MAX_IN_NODE + 1);
        // RI1: For all M + 1 entries of a node N, compute the distance between the centers of their rectangles and the
        // center of the bounding rectangle of N
        const nodeCenter = rectCenter(node.bound);
        const distances = node.items.map(
            (x) =>
                [
                    x,
                    vec2DistanceSquared(nodeCenter, rectCenter(x.bound)),
                ] as const,
        );

        // RI2: Sort the entries in *increasing order of their distances
        distances.sort((a, b) => a[1] - b[1]);

        // RI3: Remove *last p entries from N and adjust the bounding rectangle of N
        const entriesSorted = distances.map((x) => x[0]) as typeof node.items;
        const removed = entriesSorted.splice(REINSERT_P);
        const newBound = rectUnionMany(entriesSorted.map((x) => x.bound));
        node.items = entriesSorted;
        node.bound = newBound;
        adjustTreeBounds(node);

        // RI4: In the sort defined in RI2, starting with with the minimum distance (Close reinsert), invoke insert to
        // reinsert the entries
        for (const rem of removed) {
            this.insertAtLevel(node, rem, false);
        }
    }

    private adjustTree(
        node: TreeNode<T>,
        nodeSplit: TreeNode<T> | null,
        first: boolean,
    ) {
        while (node.parent !== null) {
            let parentSplit = null;
            node.parent.bound = rectUnion(node.parent.bound, node.bound);
            if (nodeSplit !== null) {
                node.parent.bound = rectUnion(
                    node.parent.bound,
                    nodeSplit.bound,
                );
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
                bound: rectUnion(node.bound, nodeSplit.bound),
            };
            node.parent = newRoot;
            nodeSplit.parent = newRoot;
            this.root = newRoot;
        }
    }
}

const X_AXIS_SELECTOR = [
    (r: Rectangle) => r.left,
    (r: Rectangle) => r.right,
] as const;
const Y_AXIS_SELECTOR = [
    (r: Rectangle) => r.top,
    (r: Rectangle) => r.bottom,
] as const;

function split<T>(node: TreeNode<T>): TreeNode<T> {
    assert(node.items.length === MAX_IN_NODE + 1);
    // Choose axis
    let chosenSplitEdge: (typeof X_AXIS_SELECTOR)[0];
    let chosenSplitIndex: number;
    let chosenSplitSemiperimeterSum = Infinity;
    for (const axis of [X_AXIS_SELECTOR, Y_AXIS_SELECTOR]) {
        let semiperimeterSum = 0;
        let distributionArea = Infinity;
        let distributionOverlap = Infinity;
        let distributionEdge: (typeof axis)[0];
        let distributionIndex: number;

        for (const edge of axis) {
            node.items.sort((a, b) => edge(a.bound) - edge(b.bound));

            const rects = node.items.map((x) => x.bound);
            for (let k = 0; k < DISTRIBUTION_COUNT; k++) {
                const region1 = rectUnionMany(rects.slice(0, MIN_IN_NODE + k));
                const region2 = rectUnionMany(rects.slice(MIN_IN_NODE + k));
                semiperimeterSum +=
                    rectSemiperimeter(region1) + rectSemiperimeter(region2);
                const area = rectArea(region1) + rectArea(region2);
                const overlap = rectAreaOfIntersection(region1, region2);

                if (
                    overlap < distributionOverlap ||
                    (overlap === distributionOverlap && area > distributionArea)
                ) {
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
    node.items.sort(
        (a, b) => chosenSplitEdge(a.bound) - chosenSplitEdge(b.bound),
    );
    const newItems = node.items.splice(chosenSplitIndex!);
    node.bound = rectUnionMany(node.items.map((x) => x.bound));
    const newBound = rectUnionMany(newItems.map((x) => x.bound));
    return {
        isLeaf: node.isLeaf,
        parent: node.parent,
        bound: newBound,
        items: newItems,
    } as typeof node;
}

function bulkInsert<T>(entries: Entry<T>[] | TreeNode<T>[]): TreeNode<T> {
    // STR:
    const pageCount = Math.ceil(entries.length / MAX_IN_NODE);
    const s = Math.ceil(Math.sqrt(pageCount));
    const slices = [];
    const sliceSize = s * MAX_IN_NODE;
    // sort by x-coord (sum gives center sort)
    entries.sort(
        (a, b) => a.bound.left + a.bound.right - (b.bound.left + b.bound.right),
    );
    for (let i = 0; i < entries.length; i += sliceSize) {
        slices.push(entries.slice(i, i + sliceSize));
    }

    const nodes: TreeNode<T>[] = [];
    for (const slice of slices) {
        // Sort slice by y centers
        slice.sort(
            (a, b) =>
                a.bound.top + a.bound.bottom - (b.bound.top + b.bound.bottom),
        );
        // Create nodes (slices of the slice).
        for (let i = 0; i < slice.length; i += MAX_IN_NODE) {
            const node = slice.slice(i, i + MAX_IN_NODE);
            const bound = rectUnionMany(node.map((x) => x.bound));

            if (isNode(node[0])) {
                const parent: Internal<T> = {
                    isLeaf: false,
                    items: node as TreeNode<T>[],
                    bound: bound,
                    parent: null,
                };

                nodes.push(parent);

                for (const child of node as TreeNode<T>[]) {
                    child.parent = parent;
                }
            } else {
                nodes.push({
                    isLeaf: true,
                    items: node as Entry<T>[],
                    bound: bound,
                    parent: null,
                });
            }
        }
    }

    if (nodes.length === 1) {
        return nodes[0];
    } else {
        return bulkInsert(nodes);
    }
}

function adjustTreeBounds<T>(node: TreeNode<T>) {
    while (node.parent !== null) {
        node.parent.bound = rectUnion(node.parent.bound, node.bound);
        node = node.parent;
    }
}

function chooseLeaf<T>(tree: TreeNode<T>, rect: Rectangle): Leaf<T> {
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
            area += rectAreaOfIntersection(e, kRect);
        }
    }

    return area;
}

function chooseSubtree<T>(node: TreeNode<T>, testRect: Rectangle): TreeNode<T> {
    if (!isInternal(node)) return node;

    if (node.items[0].isLeaf) {
        const leastP = node.items.map(
            (x) =>
                [
                    x,
                    rectAreaOfUnion(x.bound, testRect) - rectArea(x.bound),
                ] as const,
        );

        leastP.sort((a, b) => a[1] - b[1]);

        if (leastP.length > CHOOSE_SUBTREE_P) {
            leastP.splice(CHOOSE_SUBTREE_P);
        }

        const rects = node.items.map((x) => x.bound);
        const overlaps = leastP.map((e) => overlap(e[0].bound, rects));
        rects.push(testRect);
        const overlapEnlarges = leastP.map(
            (e, i) => overlap(e[0].bound, rects) - overlaps[i],
        );

        let [leastEntry, leastAreaEnlarge] = leastP.pop()!;
        let leastOverlapEnlarge = overlapEnlarges.pop()!;
        let leastArea = rectArea(leastEntry.bound);
        for (const [i, [entry, entryAreaEnlarge]] of leastP.entries()) {
            const entryOverlapEnlarge = overlapEnlarges[i];

            if (entryOverlapEnlarge > leastOverlapEnlarge) continue;
            if (
                entryOverlapEnlarge === leastOverlapEnlarge &&
                entryAreaEnlarge > leastAreaEnlarge
            ) {
                continue;
            }

            const entryArea = rectArea(entry.bound);

            if (
                entryAreaEnlarge === leastAreaEnlarge &&
                entryArea > leastArea
            ) {
                continue;
            }

            leastOverlapEnlarge = entryOverlapEnlarge;
            leastAreaEnlarge = entryAreaEnlarge;
            leastArea = entryArea;
            leastEntry = entry;
        }
        return leastEntry;
    } else {
        const enlarges = node.items.map(
            (x) => rectAreaOfUnion(x.bound, testRect) - rectArea(x.bound),
        );
        let lowestEnlarge = enlarges.pop()!;
        let lowestEntry = node.items.at(-1)!;
        for (const [i, currentEnlarge] of enlarges.entries()) {
            // If the enlargement is greater or it's tied but its area is larger, don't choose this.
            if (currentEnlarge > lowestEnlarge) continue;
            if (
                currentEnlarge === lowestEnlarge &&
                rectArea(node.items[i].bound) > rectArea(lowestEntry.bound)
            )
                continue;

            // Strictly less than or tied and the area is smaller
            lowestEntry = node.items[i];
            lowestEnlarge = currentEnlarge;
        }
        return lowestEntry;
    }
}

function* query<T>(
    n: TreeNode<T>,
    rect: Rectangle,
): Generator<Entry<T>, void, void> {
    if (isInternal(n)) {
        for (const c of n.items) {
            if (rectTestIntersects(c.bound, rect)) {
                yield* query(c, rect);
            }
        }
    } else {
        for (const c of n.items) {
            if (rectTestIntersects(c.bound, rect)) {
                yield c;
            }
        }
    }
}
