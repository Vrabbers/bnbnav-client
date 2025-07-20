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

    
    private split(node: Node<T>): Node<T> {
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

    private adjustTree(node: Node<T>, nodeSplit: Node<T> | undefined) {
        while (node.parent !== null) {
            let parentSplit = undefined;
            node.parent.bound = rectangle.union(node.parent.bound, node.bound);
            if (nodeSplit !== undefined) {
                node.parent.bound = rectangle.union(node.parent.bound, nodeSplit.bound);
                node.parent.items.push(nodeSplit);
                if (node.parent.items.length > MAX_IN_NODE) {
                    parentSplit = this.split(node.parent);
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
            leafSplit = this.split(leaf);
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

function chooseLeaf<T>(tree: Node<T>, rect: Rectangle): Leaf<T> {
    let node = tree;
    while (!isLeaf(node)) {
        node = chooseSubtree(node, rect);
    }
    return node;
}

function chooseSubtree<T>(node: Node<T>, rect: Rectangle): Node<T> {
    if (!isInternal(node))
        return node;

    let leastEntry = null;
    let leastEnlarge = Infinity;
    let leastArea = Infinity;

    for (const child of node.items) {
        const area = rectangle.area(node.bound);
        const enlarge = rectangle.area(rectangle.union(node.bound, rect)) - area;
        if (leastEntry !== null) {
            if (enlarge > leastEnlarge) continue;
            if (enlarge === leastEnlarge && area > leastArea) continue;
        }
        leastEntry = child;
        leastEnlarge = enlarge;
        leastArea = area;
    }

    assert(leastEntry !== null);

    return leastEntry;
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

