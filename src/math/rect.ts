import { vec2, Vector2 } from "./vector2";

export class Rect {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;

    private constructor(l: number, t: number, r: number, b: number) {
        this.left = l;
        this.top = t;
        this.right = r;
        this.bottom = b;
    }

    get width(): number {
        return this.right - this.left;
    }

    get height(): number {
        return this.bottom - this.top;
    }

    get area(): number {
        return this.width * this.height;
    }

    get semiperimeter(): number {
        return this.width + this.height;
    }

    get center(): Vector2 {
        return vec2((this.left + this.right) * 0.5, (this.top + this.bottom) * 0.5);
    }

    static fromCorners(topLeft: Vector2, bottomRight: Vector2): Rect {
        return new Rect(
            topLeft.x,
            topLeft.y,
            bottomRight.x,
            bottomRight.y,
        );
    }

    normalize(): Rect {
        let left = this.left;
        let right = this.right;
        if (this.left > this.right) {
            [left, right] = [right, left];
        }
        let top = this.top;
        let bottom = this.bottom;
        if (this.top > this.bottom) {
            [top, bottom] = [bottom, top];
        } 
        return new Rect(left, top, right, bottom);
    }

    static union(a: Rect, b: Rect): Rect {
        return new Rect(
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
        return new Rect(left, top, right, bottom);
    }

    static intersect(a: Rect, b: Rect): Rect | null {
        const left = Math.max(a.left, b.left);
        const right = Math.min(a.right, b.right);
        const top = Math.max(a.top, b.top);
        const bottom = Math.min(a.bottom, b.bottom);

        if (right >= left && bottom >= top) {
            return new Rect(left, top, right, bottom);
        }

        return null;
    }

    static intersectArea(a: Rect, b: Rect): number {
        const left = Math.max(a.left, b.left);
        const right = Math.min(a.right, b.right);
        const top = Math.max(a.top, b.top);
        const bottom = Math.min(a.bottom, b.bottom);

        if (right > left && bottom > top) {
            return (right - left) * (bottom - top);
        }

        return 0;
    }

    expand(x: number): Rect {
        return new Rect(
            this.left - x,
            this.top - x,
            this.right + x,
            this.bottom + x,
        );
    }
}
