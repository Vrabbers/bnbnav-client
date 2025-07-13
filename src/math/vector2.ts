
export function vec2(x: number, y: number): Vector2 {
    return new Vector2(x, y);
}

export class Vector2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static add(a: Vector2, b: Vector2) {
        return vec2(a.x + b.x, a.y + b.y);
    }

    static sub(a: Vector2, b: Vector2): Vector2 {
        return vec2(a.x - b.x, a.y - b.y);
    }

    static dot(a: Vector2, b: Vector2): number {
        return a.x * b.x + a.y * b.y;
    }

    static mul(a: Vector2, scalar: number): Vector2 {
        return vec2(a.x * scalar, a.y * scalar);
    }

    static div(a: Vector2, scalar: number): Vector2 {
        return vec2(a.x / scalar, a.y / scalar);
    }

    static distance(a: Vector2, b: Vector2): number {
        return Math.sqrt(this.distanceSquared(a, b));
    }

    static distanceSquared(a: Vector2, b: Vector2): number {
        return (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    }

    static equals(a: Vector2, b: Vector2): boolean {
        return a.x === b.x && a.y === b.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): Vector2 {
        const len = this.length();
        if (len === 0) {
            throw new RangeError("Cannot normalize a zero vector");
        }
        return Vector2.div(this, len);
    }

    negate(): Vector2 {
        return vec2(-this.x, -this.y);
    }

    toString(): string {
        return `vec2(${this.x}, ${this.y})`;
    }
}