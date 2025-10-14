import type { MapService } from "../map-data/map-service";
import { modulo } from "../math/math-helpers";
import { vec2 } from "../math/vector2";
import * as vector2 from "../math/vector2";
import { MapRendererController } from "./map-renderer-controller";
import { MapRendererState } from "./map-renderer-state";

interface GridBin {
    x: number | null;
    z: number | null;
}

const BASE_GRID_SIDE_LENGTH = 512;

export class MapRenderer {
    private readonly canvas: HTMLCanvasElement;
    private readonly state: MapRendererState;
    private readonly controller: MapRendererController;
    private width: number;
    private height: number;
    private resObv: ResizeObserver;
    private grid: GridBin[][] = [];
    private gridSideLength = BASE_GRID_SIDE_LENGTH;
    private gridWidth = 0;
    private gridHeight = 0;

    constructor(canvas: HTMLCanvasElement, mapService: MapService) {
        this.canvas = canvas;
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        this.state = new MapRendererState(mapService);
        this.controller = new MapRendererController(
            canvas,
            this.state,
            this.requestRender.bind(this),
        );
        this.controller.connect();
        this.resObv = new ResizeObserver(this.resizeCanvas.bind(this));
        this.resObv.observe(this.canvas);
    }

    private resizeGrid() {
        const log2Scale = Math.ceil(Math.log2(this.state.scale));
        const newSideLength = BASE_GRID_SIDE_LENGTH * 2 ** -log2Scale;
        if (newSideLength != this.gridSideLength) {
            this.gridSideLength = newSideLength;
        }

        const xb = Math.ceil(this.width / this.state.scale / this.gridSideLength);
        const yb = Math.ceil(this.height / this.state.scale / this.gridSideLength);

        if (this.grid.length >= xb + 1 && this.grid[0].length >= yb + 1) {
            return;
        }

        const xBins = xb * 4;
        const yBins = yb * 4;
        const a: GridBin[][] = [];
        for (let y = 0; y < yBins; y++) {
            a[y] = [];
            for (let x = 0; x < xBins; x++) {
                a[y][x] = {
                    x: null,
                    z: null,
                };
            }
        }
        this.grid = a;
        this.gridHeight = yBins;
        this.gridWidth = xBins;
    }

    private renderMap(ctx: CanvasRenderingContext2D, dt: number) {
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, this.width - 1, this.height - 1);
        ctx.save();
        ctx.textBaseline = "top";
        ctx.font = `${(16 / this.state.scale).toString()}px sans-serif`;
        ctx.transform(...this.state.transform);

        const topLeft = this.state.toWorld(vec2(0, 0));
        const bottomRight = this.state.toWorld(vec2(this.width, this.height));
        const start = vector2.floor(vector2.div(topLeft, this.gridSideLength));
        const end = vector2.ceil(vector2.div(bottomRight, this.gridSideLength));
        const diff = vector2.sub(end, start);
        const first = vector2.mul(start, this.gridSideLength);
        const modX = modulo(start.x, this.gridWidth);
        const correctedSideLength = this.gridSideLength + 1 / this.state.scale;
        let y = modulo(start.y, this.gridHeight);
        for (let j = 0; j < diff.y; j++) {
            let x = modX;
            for (let i = 0; i < diff.x; i++) {
                const entry = this.grid[y][x];
                const xIndex = start.x + i;
                const yIndex = start.y + j;
                if (entry.x !== xIndex || entry.z !== yIndex) {
                    entry.x = xIndex;
                    entry.z = yIndex;
                }

                ctx.fillStyle = `rgb(${Math.floor((x * 255) / this.gridWidth).toString()} ${Math.floor((y * 255) / this.gridHeight).toString()} 127)`;
                ctx.fillRect(
                    first.x + i * this.gridSideLength,
                    first.y + j * this.gridSideLength,
                    correctedSideLength,
                    correctedSideLength,
                );
                ctx.fillStyle = "white";
                ctx.fillText(
                    `[${(entry.x * this.gridSideLength).toString()},${(entry.z * this.gridSideLength).toString()}]`,
                    first.x + i * this.gridSideLength,
                    first.y + j * this.gridSideLength,
                );
                x = (x + 1) % this.gridWidth;
            }
            y = (y + 1) % this.gridHeight;
        }

        ctx.restore();
        ctx.fillText(
            `dt: ${dt.toString()} ms / fps: ${(1000 / dt).toString()}`,
            24,
            24,
        );
        ctx.fillText(
            `${vector2.toString(this.state.pan)} / ${this.state.scale.toString()}`,
            24,
            48,
        );
    }

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
