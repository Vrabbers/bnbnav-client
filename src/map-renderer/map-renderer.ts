import { MathH } from "../math/math-helpers";
import { vec2, Vector2 } from "../math/vector2";
import { MapController } from "./map-controller";
import { MapState } from "./map-state";

export class MapRenderer {
    #canvas: HTMLCanvasElement;
    #state: MapState;
    #controller: MapController;
    #width: number;
    #height: number;
    #resObv: ResizeObserver;
    #grid: string[][] = [[]];
    #gridSideLength = 256;

    constructor(canvas: HTMLCanvasElement) {
        this.#canvas = canvas;
        this.#width = canvas.clientWidth;
        this.#height = canvas.clientHeight;
        this.#state = new MapState();
        this.#controller = new MapController(canvas, this.#state, this.requestRender.bind(this));
        this.#controller.connect();
        this.#resObv = new ResizeObserver(this.#resizeCanvas.bind(this));
        this.#resObv.observe(this.#canvas);
    }

    #resizeGrid() {
        const log2Scale = Math.ceil(Math.log2(this.#state.scale));
        const newSideLength = 256 * (2 ** (-log2Scale));
        if (newSideLength != this.#gridSideLength) {
            this.#gridSideLength = newSideLength;
            console.log(newSideLength);
        }

        const xBins = Math.ceil(this.#width / this.#state.scale / this.#gridSideLength) * 2;
        const yBins = Math.ceil(this.#height / this.#state.scale / this.#gridSideLength) * 2;
        if (this.#grid.length >= yBins && this.#grid[0].length >= xBins)
            return;
        const a = new Array(yBins);
        for (let y = 0; y < yBins; y++) {
            a[y] = new Array(xBins);
            for (let x = 0; x < xBins; x++) {
                a[y][x] = `[${x};${y}]`;
            }
        }
        this.#grid = a;
        console.table(a);
    }

    #renderMap(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.#width - 1, this.#height - 1);

        ctx.save();
        ctx.transform(...this.#state.transform);

        const topRight = this.#state.toWorld(vec2(0, 0));
        const bottomLeft = this.#state.toWorld(vec2(this.#width, this.#height));
        const startIndex = Vector2.div(topRight, this.#gridSideLength);
        const endIndex = Vector2.div(bottomLeft, this.#gridSideLength);
        const gridWidth = this.#grid[0].length;
        const gridHeight = this.#grid.length;
        const startX = Math.floor(startIndex.x);
        const startY = Math.floor(startIndex.y);
        const endX = Math.ceil(endIndex.x);
        const endY = Math.ceil(endIndex.y);
        const xDiff = endX - startX;
        const yDiff = endY - startY;
        const firstX = Math.floor(startIndex.x) * this.#gridSideLength;
        const firstY = Math.floor(startIndex.y) * this.#gridSideLength;
        ctx.font = "48px sans-serif";
        const modX = MathH.mod(startX, gridWidth);
        let y = MathH.mod(startY, gridHeight);
        for (let j = 0; j < yDiff; j++) {
            let x = modX;
            for (let i = 0; i < xDiff; i++) {
                ctx.fillStyle = `rgb(${Math.floor(x * 255 / gridWidth)} ${Math.floor(y * 255 / gridWidth)} 0)`;
                ctx.fillRect(firstX + i * this.#gridSideLength, firstY + j * this.#gridSideLength, this.#gridSideLength + 1, this.#gridSideLength + 1);
                ctx.fillStyle = "#fff";
                ctx.fillText(this.#grid[y][x], firstX + (i) * this.#gridSideLength, firstY + (j + 1) * this.#gridSideLength);
                x = (x + 1) % gridWidth;
            }
            y = (y + 1) % gridHeight;
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
        this.#resizeGrid();
        requestAnimationFrame(this.#renderCanvas.bind(this));
    }
}