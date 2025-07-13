import { Vector2, vec2 } from "../math/vector2";
import type { MapState } from "./map-state";

export class MapController {
    #canvas: HTMLCanvasElement;
    #state: MapState;
    #update: () => void;

    #panning: boolean = false;
    #panFirstMouse: Vector2 = vec2(0, 0);
    #panFirstPan: Vector2 = vec2(0, 0);

    constructor(canvas: HTMLCanvasElement, state: MapState, update: () => void) {
        this.#canvas = canvas;
        this.#state = state;
        this.#update = update;
    }

    connect() {
        this.#canvas.addEventListener("mousedown", this.#mouseDown.bind(this));
        this.#canvas.addEventListener("mouseup", this.#mouseUp.bind(this));
        this.#canvas.addEventListener("mousemove", this.#mouseMove.bind(this));
        this.#canvas.addEventListener("wheel", this.#wheel.bind(this), { passive: false });
    }

    #mouseDown(evt: MouseEvent) {
        if (evt.button === 0) {
            this.#panning = true;
            this.#panFirstMouse = vec2(evt.x, evt.y);
            this.#panFirstPan = this.#state.pan;
        }
    }

    #mouseUp(_evt: MouseEvent) {
        this.#panning = false;
    }

    #mouseMove(evt: MouseEvent) {
        if (this.#panning) {
            const delta = Vector2.div(Vector2.sub(vec2(evt.x, evt.y), this.#panFirstMouse), this.#state.scale);
            this.#state.pan = Vector2.add(this.#panFirstPan, delta);
            this.#state.updateMatrices();
            this.#update();
        }
    }

    #wheel(evt: WheelEvent) {
        evt.preventDefault();

        const mousePos = vec2(evt.x, evt.y);
        const zoomFactor = -evt.deltaY * this.#state.scale / (evt.ctrlKey ? 100 : 1000);
        const newScale = this.#state.scale + zoomFactor;

        this.#state.zoomAt(mousePos, newScale);

        this.#update();
    }
}
