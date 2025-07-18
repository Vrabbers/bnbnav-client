import assert from "../assert";
import { type Rectangle } from "../math/rectangle";
import * as rectangle from "../math/rectangle";

const MAX_IN_NODE = 32;
const MIN_IN_NODE = 2;

export interface Entry<T> {
    entry: T,
    bound: Rectangle
}

interface Bounded {
    bound: Rectangle
}

export interface Node<T> extends Bounded { 
    isLeaf: boolean;
    parent: Internal<T> | null;
    items: (Node<T> | Entry<T>)[];
    bound: Rectangle,
}

interface Leaf<T> extends Node<T> {
    isLeaf: true;
    parent: Internal<T> | null;
    items: Entry<T>[];
    bound: Rectangle,
}

interface Internal<T> extends Node<T> {
    isLeaf: false;
    parent: Internal<T> | null;
    items: Node<T>[];
    bound: Rectangle,
}

function isLeaf<T>(n: Node<T>): n is Leaf<T> {
    return n.isLeaf;
} 

function isInternal<T>(n: Node<T>): n is Internal<T> {
    return !n.isLeaf;
} 

export class MapTree<T> {
    root: Node<T> | null = null;

    private split<N extends Node<T>>(node: N) : N {
        let largestD = -Infinity;
        let index1;
        let index2;

        for (const [i1, e1] of node.items.entries()) {
            for (const [i2, e2] of node.items.entries()) {
                if (i1 === i2) continue;
                const unionArea = rectangle.area(rectangle.union(e1.bound, e2.bound));
                const d = unionArea - rectangle.area(e1.bound) - rectangle.area(e2.bound);
                if (d > largestD) {
                    largestD = d;
                    [index1, index2] = [i1, i2];
                }
            }
        }
        assert(typeof index1 === "number" && typeof index2 === "number");

        const group1 = [node.items[index1]];
        const group2 = [node.items[index2]];
        const items = node.items.filter((_v, i) => i !== index1 && i !== index2 );
        
        let bound1 = group1[0].bound;
        let bound2 = group2[0].bound;
        let area1 = rectangle.area(bound1);
        let area2 = rectangle.area(bound2);
        
        const differences = items.map((e) => {
            const d1 = rectangle.area(rectangle.union(bound1, e.bound)) - area1;
            const d2 = rectangle.area(rectangle.union(bound2, e.bound)) - area2;
            return { entry: e, d: Math.abs(d2 - d1) };
        }).sort((a, b) => a.d - b.d).reverse();

        for (const [index, { entry, d: _d }] of differences.entries()) {
            // Values given that we added the rectangle to each one.
            const b1 = rectangle.union(bound1, entry.bound);
            const a1 = rectangle.area(b1);
            const d1 = a1 - area1;
            const b2 = rectangle.union(bound2, entry.bound)
            const a2 = rectangle.area(b2);
            const d2 = a2 - area2;

            if (d1 < d2 || (d1 === d2 && area1 < area2) || (area1 === area2 && group1.length < group2.length)) {
                bound1 = b1;
                area1 = a1;
                group1.push(entry);
            } else {
                bound2 = b2;
                area2 = a2;
                group2.push(entry);
            }

            const itemsRemaining = (differences.length - index + 1);
            if (itemsRemaining === MIN_IN_NODE) {
                if (group1.length < MIN_IN_NODE) {
                    differences.forEach(d => group1.push(d.entry));
                    bound1 = rectangle.unionMany(group1.map(x => x.bound));
                    break;
                } else if (group2.length < MIN_IN_NODE) {
                    differences.forEach(d => group2.push(d.entry));
                    bound2 = rectangle.unionMany(group2.map(x => x.bound));
                    break;
                }
            }
        }

        const newNode = {
            isLeaf: node.isLeaf,
            parent: node.parent,
            items: group2,
            bound: bound2,
        };
        node.items = group1;
        node.bound = bound1;

        return newNode as N;
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

    private *query(n: Node<T>, rect: Rectangle) : Generator<Entry<T>, void, void> {
        if (isInternal(n)) {
            for (const c of n.items) {
                if (rectangle.intersects(c.bound, rect)) {
                    yield* this.query(c, rect);
                }
            }
        } else {
            for (const c of n.items) {
                if (rectangle.intersects(c.bound, rect)) {
                    yield c as Entry<T>;
                }
            }
        }
    }

    *search(rect: Rectangle): Generator<Entry<T>, void, void> {
        if (this.root === null)
            return;

        yield* this.query(this.root, rect);
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
