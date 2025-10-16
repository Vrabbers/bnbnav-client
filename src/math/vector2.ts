export interface Vector2 {
    readonly x: number;
    readonly y: number;
}

export function vec2(x: number, y: number): Vector2 {
    return { x: x, y: y };
}

export function vec2Add(a: Vector2, b: Vector2): Vector2 {
    return vec2(a.x + b.x, a.y + b.y);
}

export function vec2Sub(a: Vector2, b: Vector2): Vector2 {
    return vec2(a.x - b.x, a.y - b.y);
}

export function vec2Dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
}

export function vec2Mul(vector: Vector2, scalar: number): Vector2 {
    return vec2(vector.x * scalar, vector.y * scalar);
}

export function vec2Div(vector: Vector2, scalar: number): Vector2 {
    return vec2(vector.x / scalar, vector.y / scalar);
}

export function vec2Distance(a: Vector2, b: Vector2): number {
    return Math.sqrt(vec2DistanceSquared(a, b));
}

export function vec2DistanceSquared(a: Vector2, b: Vector2): number {
    return (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
}

export function vec2Equals(a: Vector2, b: Vector2): boolean {
    return a.x === b.x && a.y === b.y;
}

export function vec2Length(a: Vector2): number {
    return Math.sqrt(vec2LengthSquared(a));
}

export function vec2LengthSquared(a: Vector2): number {
    return a.x * a.x + a.y * a.y;
}

export function vec2Normalize(a: Vector2): Vector2 {
    const len = vec2Length(a);
    if (len === 0) {
        throw new RangeError("Cannot normalize a zero vector");
    }
    return vec2Div(a, len);
}

export function vec2Negate(a: Vector2): Vector2 {
    return vec2(-a.x, -a.y);
}

export function vec2ToString(a: Vector2): string {
    return `(${a.x.toString()}, ${a.y.toString()})`;
}

export function vec2Floor(a: Vector2): Vector2 {
    return vec2(Math.floor(a.x), Math.floor(a.y));
}

export function vec2Ceil(a: Vector2): Vector2 {
    return vec2(Math.ceil(a.x), Math.ceil(a.y));
}
