import { clamp } from "../math/math-helpers";
import * as matrix from "../math/matrix3x2";
import { type Matrix3x2 } from "../math/matrix3x2";
import { vec2, Vector2 } from "../math/vector2";

export class MapState {
    pan: Vector2 = vec2(0, 0);
    scale = 1.5;

    transform: Matrix3x2 = matrix.identity();
    inverseTransform: Matrix3x2 = matrix.identity();

    constructor() {
        this.updateMatrices();
    }

    updateMatrices() {
        this.transform = matrix.translateScale(this.scale, this.pan);
        this.inverseTransform = matrix.inverse(this.transform);
    }

    toScreen(point: Vector2) {
        return matrix.multiplyVector(this.transform, point);
    }

    toWorld(point: Vector2) {
        return matrix.multiplyVector(this.inverseTransform, point);
    }

    zoomAt(point: Vector2, newScale: number) {
        const clampedScale = clamp(newScale, 0.125, 16);

        if (clampedScale === this.scale) return;

        const worldPosBefore = this.toWorld(point);

        this.scale = clampedScale;
        this.updateMatrices();

        const worldPosAfter = this.toWorld(point);
        const error = worldPosAfter.sub(worldPosBefore);

        this.pan = this.pan.add(error);
        this.updateMatrices();
    }
}
