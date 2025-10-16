import type { MapService } from "../map-data/map-service";
import { clamp } from "../math/math-helpers";
import * as matrix3x2 from "../math/matrix3x2";
import { type Matrix3x2 } from "../math/matrix3x2";
import { vec2, type Vector2 } from "../math/vector2";
import * as vector2 from "../math/vector2";

export class MapRendererModel {
    pan: Vector2 = vec2(0, 0);
    scale = 1.5;

    transform: Matrix3x2 = matrix3x2.identity();
    inverseTransform: Matrix3x2 = matrix3x2.identity();
    service: MapService;

    constructor(service: MapService) {
        this.service = service;
        this.updateMatrices();
    }

    updateMatrices() {
        this.transform = matrix3x2.translateScale(this.scale, this.pan);
        this.inverseTransform = matrix3x2.inverse(this.transform);
    }

    toScreen(point: Vector2) {
        return matrix3x2.multiplyVector(this.transform, point);
    }

    toWorld(point: Vector2) {
        return matrix3x2.multiplyVector(this.inverseTransform, point);
    }

    zoomAt(point: Vector2, newScale: number) {
        const clampedScale = clamp(newScale, 0.15, 8);

        if (clampedScale === this.scale) {
            return;
        }

        const worldPosBefore = this.toWorld(point);

        this.scale = clampedScale;
        this.updateMatrices();

        const worldPosAfter = this.toWorld(point);
        const error = vector2.vec2Sub(worldPosAfter, worldPosBefore);

        this.pan = vector2.vec2Add(this.pan, error);
        this.updateMatrices();
    }
}
