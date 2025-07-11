export function clamp(x: number, min: number, max: number) {
    if (x > max)
        return max;
    if (x < min)
        return min;
    return x;
}