import { type Vector2, vec2 } from "../math/vector2";
import * as vector2 from "../math/vector2";
import type { MapState } from "./map-state";

export class MapController {
    private readonly canvas: HTMLCanvasElement;
    private readonly state: MapState;
    private readonly update: () => void;

    private panning = false;
    private panFirstMouse: Vector2 = vec2(0, 0);
    private panFirstPan: Vector2 = vec2(0, 0);

    constructor(
        canvas: HTMLCanvasElement,
        state: MapState,
        update: () => void,
    ) {
        this.canvas = canvas;
        this.state = state;
        this.update = update;
    }

    connect() {
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
        this.canvas.addEventListener("mouseout", this.mouseUp.bind(this))
        this.canvas.addEventListener("wheel", this.wheel.bind(this), {
            passive: false,
        });
    }

    private mouseDown(evt: MouseEvent) {
        if (evt.button === 0) {
            this.panning = true;
            this.panFirstMouse = vec2(evt.x, evt.y);
            this.panFirstPan = this.state.pan;
        }
    }

    private mouseUp(_evt: MouseEvent) {
        if (this.panning) {
            this.panning = false;
        }
    }

    private mouseMove(evt: MouseEvent) {
        if (this.panning) {
            const delta = vector2.sub(vec2(evt.x, evt.y), this.panFirstMouse);
            const scaledDelta = vector2.div(delta, this.state.scale);
            this.state.pan = vector2.add(this.panFirstPan, scaledDelta);
            this.state.updateMatrices();
            this.update();
        }
    }

    private wheel(evt: WheelEvent) {
        evt.preventDefault();

        const mousePos = vec2(evt.x, evt.y);
        const zoomFactor =
            (-evt.deltaY * this.state.scale) / (evt.ctrlKey ? 100 : 1000);
        const newScale = this.state.scale + zoomFactor;

        this.state.zoomAt(mousePos, newScale);

        this.update();
    }
}
