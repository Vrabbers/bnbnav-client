import type { MapService } from "../map-data/map-service";
import { rect, rectExpand } from "../math/rectangle";
import { BASE_GRID_SIDE_LENGTH } from "./map-renderer";

export class RenderBin {
    xIndex: number;
    yIndex: number;
    length: number;
    isValid: boolean;
    isEmpty: boolean;
    buffer: ImageBitmap | null;

    constructor(x: number, z: number, size: number) {
        this.xIndex = x;
        this.yIndex = z;
        this.length = size;
        this.isValid = false;
        this.isEmpty = true;
        this.buffer = null;
    }

    renderToBuffer(ms: MapService) {
        const canvas = new OffscreenCanvas(
            BASE_GRID_SIDE_LENGTH,
            BASE_GRID_SIDE_LENGTH,
        );
        const ctx = canvas.getContext("2d")!;

        const x = this.xIndex * this.length;
        const y = this.yIndex * this.length;

        const scale = BASE_GRID_SIDE_LENGTH / this.length;

        const searchRect = rectExpand(
            rect(x, y, x + this.length, y + this.length),
            5 * scale,
        );

        ctx.scale(scale, scale);
        ctx.translate(-x, -y);

        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";

        for (const { entry } of ms.edgeTree.search(searchRect)) {
            this.isEmpty = false;
            const edge = ms.edges.get(entry)!;
            const n1 = ms.nodes.get(edge.node1)!;
            const n2 = ms.nodes.get(edge.node2)!;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.z);
            ctx.lineTo(n2.x, n2.z);
            ctx.stroke();
        }

        this.isValid = true;

        if (!this.isEmpty) {
            this.buffer = canvas.transferToImageBitmap();
        }
    }
}
