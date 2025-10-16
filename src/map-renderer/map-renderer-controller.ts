import { type Vector2, vec2 } from "../math/vector2";
import * as vector2 from "../math/vector2";
import type { MapRendererModel } from "./map-renderer-model";

export class MapRendererController {
    private readonly canvas: HTMLCanvasElement;
    private readonly model: MapRendererModel;
    private readonly update: () => void;

    private panning = false;
    private panFirstMouse: Vector2 = vec2(0, 0);
    private panFirstPan: Vector2 = vec2(0, 0);

    constructor(
        canvas: HTMLCanvasElement,
        state: MapRendererModel,
        update: () => void,
    ) {
        this.canvas = canvas;
        this.model = state;
        this.update = update;
    }

    connect() {
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
        this.canvas.addEventListener("mouseout", this.mouseUp.bind(this));
        this.canvas.addEventListener("wheel", this.wheel.bind(this), {
            passive: false,
        });
    }

    private mouseDown(evt: MouseEvent) {
        if (evt.button === 0) {
            this.panning = true;
            this.panFirstMouse = vec2(evt.x, evt.y);
            this.panFirstPan = this.model.pan;
        }
    }

    private mouseUp(_evt: MouseEvent) {
        if (this.panning) {
            this.panning = false;
        }
    }

    private mouseMove(evt: MouseEvent) {
        if (this.panning) {
            const delta = vector2.vec2Sub(
                vec2(evt.x, evt.y),
                this.panFirstMouse,
            );
            const scaledDelta = vector2.vec2Div(delta, this.model.scale);
            this.model.pan = vector2.vec2Add(this.panFirstPan, scaledDelta);
            this.model.updateMatrices();
            this.update();
        }
    }

    private wheel(evt: WheelEvent) {
        evt.preventDefault();

        const mousePos = vec2(evt.x, evt.y);
        const zoomFactor =
            (-evt.deltaY * this.model.scale) / (evt.ctrlKey ? 100 : 1000);
        const newScale = this.model.scale + zoomFactor;

        this.model.zoomAt(mousePos, newScale);

        this.update();
    }
}
