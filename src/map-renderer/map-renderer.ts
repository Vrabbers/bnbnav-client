import { MapController } from "./map-controller";
import { MapState } from "./map-state";

export class MapRenderer {
    #canvas: HTMLCanvasElement;
    #mapState: MapState;
    #mapControl: MapController;

    #width: number;
    #height: number;
    #resObv: ResizeObserver;

    constructor(canvas: HTMLCanvasElement) {
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
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.#width, this.#height);
        ctx.rect(0, 0, this.#width - 1, this.#height - 1);
        ctx.stroke();

        ctx.save();
        ctx.transform(...this.#mapState.transform);

        for (let i = -50; i <= 50; i++) {
            for (let j = -50; j < 50; j++) {
                const angle = Math.atan2(j, i) * 180 / Math.PI + 360;
                ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
                ctx.beginPath();
                ctx.ellipse(100 * i, 100 * j, 10, 10, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
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