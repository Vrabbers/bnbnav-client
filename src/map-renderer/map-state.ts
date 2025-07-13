import { MathH } from "../math/math-helpers";
import { Matrix3x2 } from "../math/matrix3x2";
import { vec2, Vector2 } from "../math/vector2";

export class MapState {
    pan: Vector2 = vec2(0, 0);
    scale: number = 1;

    transform: Matrix3x2 = Matrix3x2.identity();
    inverseTransform: Matrix3x2 = Matrix3x2.identity();

    constructor() {
        this.updateMatrices();
    }

    updateMatrices() {
        this.transform = Matrix3x2.translateScale(this.scale, this.pan);
        this.inverseTransform = Matrix3x2.inverse(this.transform);
    }

    toScreen(point: Vector2) {
        return Matrix3x2.multiplyVector(this.transform, point);
    }

    toWorld(point: Vector2) {
        return Matrix3x2.multiplyVector(this.inverseTransform, point);
    }

    zoomAt(point: Vector2, newScale: number) {
        const clampedScale = MathH.clamp(newScale, 0.1, 20);

        if (clampedScale === this.scale)
            return;
        
        const worldPosBefore = this.toWorld(point);
        
        this.scale = clampedScale;
        this.updateMatrices();
        
        const worldPosAfter = this.toWorld(point);
        const error = Vector2.sub(worldPosAfter, worldPosBefore);
        
        this.pan = Vector2.add(this.pan, error);
        this.updateMatrices();
    }

}