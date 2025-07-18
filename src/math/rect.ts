export interface Rect {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}

export function rect(l: number, t: number, r: number, b: number): Rect {
    return {
        left: l,
        top: t,
        right: r,
        bottom: b,
    };
}

export function width(r: Rect): number {
    return r.right - r.left;
}

export function height(r: Rect): number {
    return r.bottom - r.top;
}

export function area(r: Rect): number {
    return width(r) * height(r);
}

export function normalize(r: Rect): Rect {
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

export function union(a: Rect, b: Rect): Rect {
    return rect(
        Math.min(a.left, b.left),
        Math.min(a.top, b.top),
        Math.max(a.right, b.right),
        Math.max(a.bottom, b.bottom),
    );
}

export function unionMany(rects: Rect[]): Rect {
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

export function intersect(a: Rect, b: Rect): Rect | null {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);

    if (right >= left && bottom >= top) {
        return rect(left, top, right, bottom);
    }

    return null;
}

export function intersectArea(a: Rect, b: Rect): number {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);

    if (right > left && bottom > top) {
        return (right - left) * (bottom - top);
    }

    return 0;
}

export function expand(r: Rect, x: number): Rect {
    return rect(
        r.left - x,
        r.top - x,
        r.right + x,
        r.bottom + x,
    );
}

