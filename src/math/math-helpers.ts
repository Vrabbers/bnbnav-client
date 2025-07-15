export const MathH = {
    clamp(x: number, min: number, max: number): number {
        if (x > max) return max;
        if (x < min) return min;
        return x;
    },

    mod(n: number, d: number): number {
        return ((n % d) + d) % d;
    },
};
