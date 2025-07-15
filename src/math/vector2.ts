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

    add(other: Vector2): Vector2 {
        return vec2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vector2): Vector2 {
        return vec2(this.x - other.x, this.y - other.y);
    }

    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    mul(scalar: number): Vector2 {
        return vec2(this.x * scalar, this.y * scalar);
    }

    div(scalar: number): Vector2 {
        return vec2(this.x / scalar, this.y / scalar);
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
        return this.div(len);
    }

    negate(): Vector2 {
        return vec2(-this.x, -this.y);
    }

    toString(): string {
        return `vec2(${this.x.toString()}, ${this.y.toString()})`;
    }

    map(fn: (x: number) => number): Vector2 {
        return vec2(fn(this.x), fn(this.y));
    }
}
