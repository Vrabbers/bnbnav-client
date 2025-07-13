import { MathH } from "../math/math";
import { Matrix3x2 } from "../math/matrix3x2";
import { Vector2, vec2 } from "../math/vector2";

export class MapCanvas {
    #canvas: HTMLCanvasElement;
    #panning: boolean = false;
    #panFirstMouse: Vector2 = vec2(0, 0);
    #panFirstPan: Vector2 = vec2(0, 0);
    #width: number;
    #height: number;
    #pan: Vector2 = vec2(0, 0);
    #resObv!: ResizeObserver;
    #scale: number = 1;
    #rotate: number = 0;
    #transform: Matrix3x2 = Matrix3x2.identity();
    #inverseTransform: Matrix3x2 = Matrix3x2.identity();

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#width = canvas.clientWidth;
        this.#height = canvas.clientHeight;
        this.#setupEvents();
        this.#resizeCanvas();
    }

    #updateMatrices() {
        this.#transform = Matrix3x2.transform(this.#scale, this.#rotate, this.#pan);
        this.#inverseTransform = Matrix3x2.inverse(this.#transform);
    }

    #toScreen(point: Vector2) {
        return Matrix3x2.multiplyVector(this.#transform, point);
    }

    #toWorld(point: Vector2) {
        return Matrix3x2.multiplyVector(this.#inverseTransform, point);
    }

    #renderCanvas() {
        const ctx = this.#canvas.getContext("2d")!;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.#width = this.#canvas.width / window.devicePixelRatio;
        this.#height = this.#canvas.height / window.devicePixelRatio;
        this.#renderMap(ctx);
        ctx.resetTransform();
    }

    #transformStack: DOMMatrix[] = [];
    #pushTransform(ctx: CanvasRenderingContext2D) {
        this.#transformStack.push(ctx.getTransform());
    }
    #popTransform(ctx: CanvasRenderingContext2D) {
        ctx.setTransform(this.#transformStack.pop());
    }

    #renderMap(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, this.#width, this.#height);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.#width, this.#height);
        ctx.rect(0, 0, this.#width - 1, this.#height - 1);
        ctx.stroke();
        this.#pushTransform(ctx);
        ctx.transform(...this.#transform);
        for (let i = -50; i <= 50; i++) {
            for (let j = -50; j < 50; j++) {
                const angle = Math.atan2(j, i) * 180 / Math.PI + 360;
                ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
                ctx.beginPath();
                ctx.ellipse(100 * i, 100 * j, 10, 10, 0, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        this.#popTransform(ctx)
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

    #mouseUp(evt: MouseEvent) {
        this.#panning = false;
        const toWorld = this.#toWorld(vec2(evt.x, evt.y));
        const toScreen = this.#toScreen(toWorld);
        console.log(`${evt.x},${evt.y} Clicked position ${toWorld} in world space (which is ${toScreen} back to screen space)`);
    }

    #mouseMove(evt: MouseEvent) {
        if (this.#panning) {
            const delta = Vector2.sub(vec2(evt.x, evt.y), this.#panFirstMouse);
            const newPan = Vector2.add(this.#panFirstPan, delta);
            this.#pan = newPan;
            this.#updateMatrices();
            this.queueRerender();
        }
    }

    #wheel(evt: WheelEvent) {
        evt.preventDefault();

        let zoom = this.#scale;
        zoom += -evt.deltaY * zoom / (evt.ctrlKey ? 100 : 1000);
        zoom = MathH.clamp(zoom, 0.1, 20);
        if (zoom !== this.#scale) {
            //const previousPosition = this.#toWorld(vec2(evt.x, evt.y));
            this.#scale = zoom;
            this.#updateMatrices();
            //const incorrectPosition = this.#toWorld(vec2(evt.x, evt.y));
            //const error = Vector2.sub(incorrectPosition, previousPosition);
            //this.#pan = Vector2.sub(this.#pan, error);
            //this.#updateMatrices();
            this.queueRerender();
        }
    }
}