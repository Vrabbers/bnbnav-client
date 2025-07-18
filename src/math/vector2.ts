export interface Vector2 {
    readonly x: number;
    readonly y: number;
}

export function vec2(x: number, y: number): Vector2 {
    return { x: x, y: y };
}

export function add(a: Vector2, b: Vector2): Vector2 {
    return vec2(a.x + b.x, a.y + b.y);
}

export function sub(a: Vector2, b: Vector2): Vector2 {
    return vec2(a.x - b.x, a.y - b.y);
}

export function dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
}

export function mul(vector: Vector2, scalar: number): Vector2 {
    return vec2(vector.x * scalar, vector.y * scalar);
}

export function div(vector: Vector2, scalar: number): Vector2 {
    return vec2(vector.x / scalar, vector.y / scalar);
}

export function distance(a: Vector2, b: Vector2): number {
    return Math.sqrt(distanceSquared(a, b));
}

export function distanceSquared(a: Vector2, b: Vector2): number {
    return (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
}

export function equals(a: Vector2, b: Vector2): boolean {
    return a.x === b.x && a.y === b.y;
}

export function length(a: Vector2): number {
    return Math.sqrt(lengthSquared(a));
}

export function lengthSquared(a: Vector2): number {
    return a.x * a.x + a.y * a.y;
}

export function normalize(a: Vector2): Vector2 {
    const len = length(a);
    if (len === 0) {
        throw new RangeError("Cannot normalize a zero vector");
    }
    return div(a, len);
}

export function negate(a: Vector2): Vector2 {
    return vec2(-a.x, -a.y);
}

export function toString(a: Vector2): string {
    return `(${a.x.toString()}, ${a.y.toString()})`;
}

export function floor(a: Vector2): Vector2 {
    return vec2(Math.floor(a.x), Math.floor(a.y));
}

export function ceil(a: Vector2): Vector2 {
    return vec2(Math.ceil(a.x), Math.ceil(a.y));
}