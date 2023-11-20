import { Board } from "./logic";

function imageFromName(fileName: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // to avoid CORS if used with Canvas
        img.src = new URL(`./images/${fileName}.png`, import.meta.url).href
        img.onload = () => {
        resolve(img);
        }
        img.onerror = e => {
        reject(e);
        }
    })
}

let cellSize: number = 15;
export const PALETTE = ["#0e0e12", "#1a1a24", "#333346", "#535373", "#8080a4", "#a6a6bf", "#c1c1d2", "#e6e6ec", "bonus color"] as const;

let boostTexture = await imageFromName('boost');


export function drawBoard(context: CanvasRenderingContext2D, board: Board, center: [number, number]) {
    context.fillStyle = PALETTE[5];
    context.fillRect(center[0] - cellSize * board.size[1] / 2, center[1] - cellSize * board.size[0] / 2, cellSize * board.size[1], cellSize * board.size[0]);
    context.drawImage(boostTexture, center[0] + cellSize / 2, center[1] - cellSize / 2);

    const topLeft: [number, number] = [center[0] - cellSize * board.size[1] / 2, center[1]- cellSize * board.size[0] / 2]
    context.fillStyle = PALETTE[6];
    for (let row = 0; row < board.size[0]; row++) {
        for (let column = 0; column < board.size[1]; column++) {
            if ((row + column) % 2 == 0) {
                context.fillRect(topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
        }
    }
}

export function updateDrawerConfig(config: { cellSize: number }) {
    cellSize = config.cellSize;
}
