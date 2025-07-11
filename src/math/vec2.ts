
export function vec2(x: number, y: number): Vec2 {
    return new Vec2(x, y);
}

export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static add(a: Vec2, b: Vec2) {
        return vec2(a.x + b.x, a.y + b.y);
    }

    static sub(a: Vec2, b: Vec2): Vec2 {
        return vec2(a.x - b.x, a.y - b.y);
    }

    static dot(a: Vec2, b: Vec2): number {
        return a.x * b.x + a.y * b.y;
    }

    static mul(a: Vec2, scalar: number): Vec2 {
        return vec2(a.x * scalar, a.y * scalar);
    }

    static div(a: Vec2, scalar: number): Vec2 {
        return vec2(a.x / scalar, a.y / scalar);
    }

    static distance(a: Vec2, b: Vec2): number {
        return Math.sqrt(this.distanceSquared(a, b));
    }

    static distanceSquared(a: Vec2, b: Vec2): number {
        return (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    }

    static equals(a: Vec2, b: Vec2): boolean {
        return a.x === b.x && a.y === b.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vec2 {
        const len = this.length();
        if (len === 0) {
            throw new RangeError("Cannot normalize a zero vector");
        }
        return Vec2.div(this, len);
    }

    negate(): Vec2 {
        return vec2(-this.x, -this.y);
    }
}