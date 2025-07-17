import { Vector2, vec2 } from "./vector2";

// Represents a tranformation matrix, as those token by
// e.g. the CanvasRenderingContext2D>>transform function (use ... operator)
// (which is why they appear weirdly transposed)
export type Matrix3x2 = [
    number, number,
    number, number,
    number, number,
];

export function identity(): Matrix3x2 {
    return [
        1, 0,
        0, 1,
        0, 0
    ];
}

export function add(m1: Matrix3x2, m2: Matrix3x2): Matrix3x2 {
    return [
        m1[0] + m2[0], m1[1] + m2[1],
        m1[2] + m2[2], m1[3] + m2[3],
        m1[4] + m2[4], m1[5] + m2[5]
    ];
}

export function multiplyScalar(m: Matrix3x2, scalar: number): Matrix3x2 {
    return [
        m[0] * scalar, m[1] * scalar,
        m[2] * scalar, m[3] * scalar,
        m[4] * scalar, m[5] * scalar
    ];
}

export function multiplyVector(m: Matrix3x2, v: Vector2): Vector2 {
    return vec2(
        m[0] * v.x + m[2] * v.y + m[4],
        m[1] * v.x + m[3] * v.y + m[5]
    );
}

export function scale(s: number): Matrix3x2 {
    return [
        s, 0,
        0, s,
        0, 0,
    ];
}

export function rotate(angle: number): Matrix3x2 {
    if (angle === 0) {
        return identity();
    }

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return [
        cosA, -sinA,
        sinA, cosA,
        0, 0
    ];
}

export function translate(t: Vector2): Matrix3x2 {
    return [
        1, 0,
        0, 1,
        t.x, t.y,
    ];
}

export function translateScale(s: number, t: Vector2): Matrix3x2 {
    return [
        s, 0,
        0, s,
        t.x * s, t.y * s
    ]
}

export function transform(s: number, angle: number, t: Vector2): Matrix3x2 {
    const rotation = rotate(angle);
    const scaling = scale(s);
    const translation = translate(t);
    const scaledRotation = multiplyMatrix(scaling, rotation);
    return multiplyMatrix(scaledRotation, translation);
}

export function multiplyMatrix(m: Matrix3x2, n: Matrix3x2): Matrix3x2 {
    return [
        m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
        m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
        m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]
    ];
}

export function inverse(m: Matrix3x2): Matrix3x2 {
    const det = m[0] * m[3] - m[1] * m[2];
    if (det === 0) {
        throw new RangeError("Matrix is non-invertible");
    }

    const invDet = 1 / det;
    return [
        m[3] * invDet, -m[1] * invDet,
        -m[2] * invDet, m[0] * invDet,
        (m[2] * m[5] - m[3] * m[4]) * invDet, (m[1] * m[4] - m[0] * m[5]) * invDet,
    ];
}

