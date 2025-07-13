import type { MapData } from "../map-data/json-types";
import { MapController } from "./map-controller";
import { MapState } from "./map-state";

export class MapRenderer {
    #canvas: HTMLCanvasElement;
    #mapState: MapState;
    #mapControl: MapController;
    #data: MapData;
    #width: number;
    #height: number;
    #resObv: ResizeObserver;

    constructor(canvas: HTMLCanvasElement, data: MapData) {
        this.#data = data;
        this.#canvas = canvas;
        this.#width = canvas.clientWidth;
        this.#height = canvas.clientHeight;
        this.#mapState = new MapState();
        this.#mapControl = new MapController(canvas, this.#mapState, this.requestRender.bind(this));
        this.#mapControl.connect();
        this.#resObv = new ResizeObserver(this.#resizeCanvas.bind(this));
        this.#resObv.observe(this.#canvas);
    }

    #renderMap(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, this.#width - 1, this.#height - 1);

        ctx.save();
        ctx.transform(...this.#mapState.transform);
        for (const [_, edge] of this.#data.edges) {
            const node1 = this.#data.nodes.get(edge.node1)!;
            const node2 = this.#data.nodes.get(edge.node2)!;
            ctx.beginPath()
            ctx.moveTo(node1.x, node1.z);
            ctx.lineTo(node2.x, node2.z);
            ctx.stroke();
        }

        ctx.restore();
    }

    #resizeCanvas() {
        const w = this.#canvas.clientWidth;
        const h = this.#canvas.clientHeight;
        this.#canvas.width = w * window.devicePixelRatio;
        this.#canvas.height = h * window.devicePixelRatio;
        this.requestRender();
    }

    #renderCanvas() {
        const ctx = this.#canvas.getContext("2d")!;
        ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.#width = this.#canvas.width / window.devicePixelRatio;
        this.#height = this.#canvas.height / window.devicePixelRatio;
        
        this.#renderMap(ctx);

        ctx.resetTransform();
    }

    requestRender() {
        requestAnimationFrame(this.#renderCanvas.bind(this));
    }
}