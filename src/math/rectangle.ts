import { vec2, type Vector2 } from "./vector2";

export interface Rectangle {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}

export function rect(l: number, t: number, r: number, b: number): Rectangle {
    return {
        left: l,
        top: t,
        right: r,
        bottom: b,
    };
}

export function rectWidth(r: Rectangle): number {
    return r.right - r.left;
}

export function rectHeight(r: Rectangle): number {
    return r.bottom - r.top;
}

export function rectArea(r: Rectangle): number {
    return rectWidth(r) * rectHeight(r);
}

export function rectNormalize(r: Rectangle): Rectangle {
    let left = r.left;
    let right = r.right;
    if (r.left > r.right) {
        [left, right] = [right, left];
    }
    let top = r.top;
    let bottom = r.bottom;
    if (r.top > r.bottom) {
        [top, bottom] = [bottom, top];
    }
    return rect(left, top, right, bottom);
}

export function rectUnion(a: Rectangle, b: Rectangle): Rectangle {
    return rect(
        Math.min(a.left, b.left),
        Math.min(a.top, b.top),
        Math.max(a.right, b.right),
        Math.max(a.bottom, b.bottom),
    );
}

export function rectAreaOfUnion(x: Rectangle, y: Rectangle): number {
    const l = Math.min(x.left, y.left);
    const t = Math.min(x.top, y.top);
    const r = Math.max(x.right, y.right);
    const b = Math.max(x.bottom, y.bottom);
    return (r - l) * (b - t);
}

export function rectUnionMany(rects: Rectangle[]): Rectangle {
    let top = +Infinity;
    let left = +Infinity;
    let bottom = -Infinity;
    let right = -Infinity;
    for (const rect of rects) {
        top = Math.min(top, rect.top);
        left = Math.min(left, rect.left);
        bottom = Math.max(bottom, rect.bottom);
        right = Math.max(right, rect.right);
    }
    return rect(left, top, right, bottom);
}

export function rectIntersection(a: Rectangle, b: Rectangle): Rectangle | null {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);

    if (right >= left && bottom >= top) {
        return rect(left, top, right, bottom);
    }

    return null;
}

export function rectAreaOfIntersection(a: Rectangle, b: Rectangle): number {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);

    if (right > left && bottom > top) {
        return (right - left) * (bottom - top);
    }

    return 0;
}

export function rectTestIntersects(a: Rectangle, b: Rectangle): boolean {
    return (
        a.left <= b.right &&
        b.left <= a.right &&
        a.top <= b.bottom &&
        b.top <= a.bottom
    );
}

export function rectExpand(r: Rectangle, x: number): Rectangle {
    return rect(r.left - x, r.top - x, r.right + x, r.bottom + x);
}

export function rectSemiperimeter(r: Rectangle): number {
    return r.right - r.left + (r.bottom - r.top);
}

export function rectCenter(r: Rectangle): Vector2 {
    return vec2((r.left + r.right) * 0.5, (r.top + r.bottom) * 0.5);
}
