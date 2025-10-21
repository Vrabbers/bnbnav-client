import type { MapService } from "../map-data/map-service.ts";
import { modulo } from "../math/math-helpers.ts";
import {
    vec2,
    vec2Ceil,
    vec2Div,
    vec2Floor,
    vec2Mul,
    vec2Sub,
    vec2ToString,
} from "../math/vector2.ts";
import { MapRendererController } from "./map-renderer-controller.ts";
import { MapRendererModel } from "./map-renderer-model.ts";
import { RenderBin } from "./render-bin.ts";

export const BASE_GRID_SIDE_LENGTH = 512;

export class MapRenderer {
    private readonly state: MapRendererModel;
    private readonly controller: MapRendererController;
    private canvas: HTMLCanvasElement;
    private width: number;
    private height: number;
    private resObv: ResizeObserver;
    private grid: (RenderBin | null)[][] = [];
    private gridSideLength = BASE_GRID_SIDE_LENGTH;
    private gridWidth = 0;
    private gridHeight = 0;

    constructor(canvas: HTMLCanvasElement, mapService: MapService) {
        this.canvas = canvas;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.state = new MapRendererModel(mapService);
        this.controller = new MapRendererController(
            canvas,
            this.state,
            this.requestRender.bind(this),
        );
        this.controller.connect();
        this.resObv = new ResizeObserver(this.resizeCanvas.bind(this));
        this.resObv.observe(this.canvas);
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.resObv.disconnect();
        this.canvas = canvas;
        this.resObv.observe(this.canvas);
        this.resizeCanvas();
    }

    private resizeGrid() {
        const log2Scale = Math.ceil(Math.log2(this.state.scale));
        const newSideLength = BASE_GRID_SIDE_LENGTH * 2 ** -log2Scale;
        if (newSideLength != this.gridSideLength) {
            this.gridSideLength = newSideLength;
        }

        const xb = Math.ceil(
            this.width / this.state.scale / this.gridSideLength,
        );
        const yb = Math.ceil(
            this.height / this.state.scale / this.gridSideLength,
        );

        if (this.grid.length >= xb + 1 && this.grid[0].length >= yb + 1) {
            return;
        }

        const xBins = xb * 2;
        const yBins = yb * 2;
        const a: (RenderBin | null)[][] = [];
        for (let y = 0; y < yBins; y++) {
            a[y] = [];
            for (let x = 0; x < xBins; x++) {
                a[y][x] = null;
            }
        }
        this.grid = a;
        this.gridHeight = yBins;
        this.gridWidth = xBins;
    }

    private renderMap(ctx: CanvasRenderingContext2D, dt: number) {
        ctx.save();
        ctx.textBaseline = "top";
        ctx.font = `${(16 / this.state.scale).toString()}px sans-serif`;
        ctx.transform(...this.state.transform);

        const topLeft = this.state.toWorld(vec2(0, 0));
        const bottomRight = this.state.toWorld(vec2(this.width, this.height));
        const start = vec2Floor(vec2Div(topLeft, this.gridSideLength));
        const end = vec2Ceil(vec2Div(bottomRight, this.gridSideLength));
        const diff = vec2Sub(end, start);
        const first = vec2Mul(start, this.gridSideLength);
        const modX = modulo(start.x, this.gridWidth);
        const correctedSideLength = this.gridSideLength + 1 / this.state.scale;
        let y = modulo(start.y, this.gridHeight);
        for (let j = 0; j < diff.y; j++) {
            let x = modX;
            for (let i = 0; i < diff.x; i++) {
                let entry = this.grid[y][x];
                const xIndex = start.x + i;
                const yIndex = start.y + j;
                if (
                    entry === null ||
                    entry.xIndex !== xIndex ||
                    entry.yIndex !== yIndex ||
                    entry.length !== this.gridSideLength
                ) {
                    entry = new RenderBin(xIndex, yIndex, this.gridSideLength);
                    this.grid[y][x] = entry;
                    entry.renderToBuffer(this.state.service);
                }

                if (!entry.isEmpty) {
                    ctx.fillStyle = `rgb(${Math.floor((x * 127) / this.gridWidth + 127).toString()} ${Math.floor((y * 127) / this.gridHeight + 126).toString()} 255)`;
                    ctx.fillRect(
                        first.x + i * this.gridSideLength,
                        first.y + j * this.gridSideLength,
                        correctedSideLength,
                        correctedSideLength,
                    );
                    ctx.fillStyle = "black";
                    ctx.fillText(
                        `[${(entry.xIndex * this.gridSideLength).toString()},${(entry.yIndex * this.gridSideLength).toString()}]`,
                        first.x + i * this.gridSideLength,
                        first.y + j * this.gridSideLength,
                    );

                    ctx.drawImage(
                        entry.buffer!,
                        first.x + i * this.gridSideLength,
                        first.y + j * this.gridSideLength,
                        this.gridSideLength,
                        this.gridSideLength,
                    );
                }
                x = (x + 1) % this.gridWidth;
            }
            y = (y + 1) % this.gridHeight;
        }

        const fps = 1000 / dt;
        ctx.restore();
        ctx.fillText(
            `dt: ${dt.toString()} ms / fps: ${fps.toString()}`,
            24,
            24,
        );
        ctx.fillText(
            `${vec2ToString(this.state.pan)} / ${this.state.scale.toString()}`,
            24,
            48,
        );
    }

    fpses = [] as number[];

    private resizeCanvas() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.canvas.width = w * window.devicePixelRatio;
        this.canvas.height = h * window.devicePixelRatio;
        this.requestRender();
    }
    private lastTime = NaN;
    private renderCanvas(time: number) {
        const ctx = this.canvas.getContext("2d");

        if (ctx === null) {
            throw new Error("Unable to get 2D canvas context?");
        }

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = this.canvas.width / window.devicePixelRatio;
        this.height = this.canvas.height / window.devicePixelRatio;

        this.renderMap(ctx, time - this.lastTime);

        ctx.resetTransform();
        this.lastTime = time;
    }

    requestRender() {
        this.resizeGrid();
        requestAnimationFrame(this.renderCanvas.bind(this));
    }
}
