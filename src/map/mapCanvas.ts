import { clamp } from "../math/math";
import { Vec2, vec2 } from "../math/vec2";

export class MapCanvas {
    #canvas: HTMLCanvasElement;
    #panning: boolean = false;
    #panFirstMouse: Vec2 = vec2(0, 0);
    #panFirstPan: Vec2 = vec2(0, 0);
    #width: number;
    #height: number;
    #pan: Vec2 = vec2(0, 0);
    #resObv!: ResizeObserver;
    #zoom: number = 1;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#width = canvas.clientWidth;
        this.#height = canvas.clientHeight;
        this.#setupEvents();
        this.#resizeCanvas();
    }

    #renderCanvas() {
        const ctx = this.#canvas.getContext("2d")!;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.#width = this.#canvas.width / window.devicePixelRatio;
        this.#height = this.#canvas.height / window.devicePixelRatio;
        this.#renderMap(ctx);
        ctx.resetTransform();
    }

    #renderMap(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.#width, this.#height);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.lineWidth = this.#zoom;
        ctx.fillRect(this.#pan.x, this.#pan.y, 10 * this.#zoom, 10 * this.#zoom);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.#width, this.#height);
        ctx.rect(1, 1, this.#width - 2, this.#height - 2);
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.fillText(`${this.#pan.x} ${this.#pan.y}\n${this.#zoom}`, this.#pan.x, this.#pan.y);
    }

    queueRerender() {
        requestAnimationFrame(this.#renderCanvas.bind(this));
    }

    #resizeCanvas() {
        requestAnimationFrame(() => {
            const w = this.#canvas.clientWidth;
            const h = this.#canvas.clientHeight;
            this.#canvas.width = w * window.devicePixelRatio;
            this.#canvas.height = h * window.devicePixelRatio;
            this.#renderCanvas();
        });
    }

    #setupEvents() {
        this.#resObv = new ResizeObserver(this.#resizeCanvas.bind(this));
        this.#resObv.observe(this.#canvas);
        this.#canvas.addEventListener("mousedown", this.#mouseDown.bind(this));
        this.#canvas.addEventListener("mouseup", this.#mouseUp.bind(this));
        this.#canvas.addEventListener("mousemove", this.#mouseMove.bind(this));
        this.#canvas.addEventListener("wheel", this.#wheel.bind(this), { passive: false });
    }

    #mouseDown(evt: MouseEvent) {
        if (evt.button === 0) {
            this.#panning = true;
            this.#panFirstMouse = vec2(evt.x, evt.y);
            this.#panFirstPan = this.#pan;
        }
    }

    #mouseUp(_evt: MouseEvent) {
        this.#panning = false;
    }

    #mouseMove(evt: MouseEvent) {
        if (this.#panning) {
            const delta = Vec2.sub(vec2(evt.x, evt.y), this.#panFirstMouse);
            const newPan = Vec2.add(this.#panFirstPan, delta);
            this.#pan = newPan;
            this.queueRerender();
        }
    }

    #wheel(evt: WheelEvent) {
        evt.preventDefault();
        
        let zoom = this.#zoom;
        zoom += -evt.deltaY * zoom / (evt.ctrlKey ? 100 : 1000);
        zoom = clamp(zoom, 0.1, 20);
        if (zoom !== this.#zoom) {
            this.#zoom = zoom;
            this.queueRerender();
        }
    }
}