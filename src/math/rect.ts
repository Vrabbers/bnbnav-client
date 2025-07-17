import { vec2, Vector2 } from "./vector2";

export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    get left(): number {
        return this.x;
    }

    get top(): number {
        return this.y;
    }

    get right(): number {
        return this.x + this.width;
    }

    get bottom(): number {
        return this.y + this.height;
    }

    get area(): number {
        return this.width * this.height;
    }

    get semiperimeter(): number {
        return this.width + this.height;
    }

    get center(): Vector2 {
        return vec2(this.x + this.width * 0.5, this.y + this.height * 0.5);
    }

    static fromEdges(left: number, top: number, right: number, bottom: number) {
        return new Rect(left, top, right - left, bottom - top);
    }

    static fromCorners(topLeft: Vector2, bottomRight: Vector2): Rect {
        return this.fromEdges(
            topLeft.x,
            topLeft.y,
            bottomRight.x,
            bottomRight.y,
        );
    }

    normalize(): Rect {
        if (this.height >= 0 || this.width >= 0) {
            return this;
        } else {
            let x = this.x;
            let y = this.y;
            let width = this.width;
            let height = this.height;
            if (width < 0) {
                x += width;
                width = -width;
            }
            if (height < 0) {
                y += height;
                height = -height;
            }
            return new Rect(x, y, width, height);
        }
    }

    static union(a: Rect, b: Rect): Rect {
        return this.fromEdges(
            Math.min(a.left, b.left),
            Math.min(a.top, b.top),
            Math.max(a.right, b.right),
            Math.max(a.bottom, b.bottom),
        );
    }

    static unionMany(rects: Rect[]): Rect {
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
        return this.fromEdges(left, top, right, bottom);
    }

    static intersect(a: Rect, b: Rect): Rect | null {
        const left = Math.max(a.left, b.left);
        const right = Math.min(a.right, b.right);
        const top = Math.max(a.top, b.top);
        const bottom = Math.min(a.bottom, b.bottom);

        if (right >= left && bottom >= top) {
            return this.fromEdges(left, top, right, bottom);
        }

        return null;
    }

    static intersectArea(a: Rect, b: Rect): number {
        const left = Math.max(a.left, b.left);
        const right = Math.min(a.right, b.right);
        const top = Math.max(a.top, b.top);
        const bottom = Math.min(a.bottom, b.bottom);

        if (right >= left && bottom >= top) {
            return (right - left) * (bottom - top);
        }

        return 0;
    }

    expand(w: number, h: number): Rect {
        return new Rect(
            this.x - w,
            this.y - w,
            this.width + 2 * w,
            this.height + 2 * h,
        );
    }
}
