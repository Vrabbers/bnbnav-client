type Vec2 = [number, number];

export class Map {
    #canvas: HTMLCanvasElement;
    #panning: boolean = false;
    #panFirstMouse: Vec2 = [0, 0];
    #panFirstPan: Vec2 = [0, 0];
    #width: number;
    #height: number;
    #pan: Vec2 = [0, 0];
    #resObv!: ResizeObserver;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#width = canvas.clientWidth;
        this.#height = canvas.clientHeight;
        this.#setupEvents();
        this.#resizeCanvas();
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
        this.#resObv = new ResizeObserver(() => this.#resizeCanvas());
        this.#resObv.observe(this.#canvas);
        this.#canvas.addEventListener("mousedown", (evt) => this.#mouseDown(evt));
        this.#canvas.addEventListener("mouseup", (_evt) => this.#mouseUp());
        this.#canvas.addEventListener("mousemove", (evt) => this.#mouseMove(evt));
    }

    #renderMap(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.fillRect(0, 0, this.#width, this.#height);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.#width, this.#height);
        ctx.rect(1, 1, this.#width - 2, this.#height - 2);
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.fillText(`${this.#pan[0]} ${this.#pan[1]}`, 10, 10);
    }

    #mouseDown(evt: MouseEvent) {
        if (evt.button === 0) {
            console.log("start pan");
            this.#panning = true;
            this.#panFirstMouse = [evt.x, evt.y];
            this.#panFirstPan = this.#pan;
        }
    }

    #mouseUp() {
        this.#panning = false;
    }

    #mouseMove(evt: MouseEvent) {
        if (this.#panning) {
            const [panX, panY] = this.#panFirstPan;
            const [mouX, mouY] = this.#panFirstMouse;
            const newPan: Vec2 = [panX + (mouX - evt.x), panY + (mouY - evt.y)];
            this.#pan = (newPan)
            this.render();
        }
    }

    #renderCanvas() {
        const ctx = this.#canvas.getContext("2d")!;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.#width = this.#canvas.width / window.devicePixelRatio;
        this.#height = this.#canvas.height / window.devicePixelRatio;
        this.#renderMap(ctx);
        ctx.resetTransform();
    }

    render() {
        requestAnimationFrame(() => (this.#renderCanvas()));
    }
}