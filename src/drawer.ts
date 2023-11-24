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

let cellSize: number = 40;
export const PALETTE = ["#0e0e12", "#1a1a24", "#333346", "#535373", "#8080a4", "#a6a6bf", "#c1c1d2", "#e6e6ec", "bonus color"] as const;

const boostTexture = await imageFromName('boost');
const mirrorTexture = await imageFromName('mirror');


export function drawBoard(context: CanvasRenderingContext2D, board: Board, center: [number, number]) {
    context.fillStyle = PALETTE[5];
    context.fillRect(center[0] - cellSize * board.size[1] / 2, center[1] - cellSize * board.size[0] / 2, cellSize * board.size[1], cellSize * board.size[0]);

    const topLeft: [number, number] = [center[0] - cellSize * board.size[1] / 2, center[1]- cellSize * board.size[0] / 2]

    // draw tiles
    context.fillStyle = PALETTE[6];
    for (let row = 0; row < board.size[0]; row++) {
        for (let column = 0; column < board.size[1]; column++) {
            if ((row + column) % 2 == 0) {
                context.fillRect(topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
            if (board.cells[row][column].boost) {
                context.drawImage(boostTexture, topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
        }
    }

    // draw mirrors
    for (let row = 0; row < board.size[0]; row++) {
        for (let column = 0; column < board.size[1]; column++) {
            if (board.cells[row][column].hasMirror()) {
                if (board.cells[row][column].mirrorUpRight) {
                    context.drawImage(mirrorTexture, topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
                }
                else {
                    context.save();
                    let x = topLeft[0] + cellSize * (column + 0.5), y = topLeft[1] + cellSize * (row + 0.5);
                    context.translate(x, y);
                    context.rotate(Math.PI / 2);
                    context.translate(-x, -y);
                    context.drawImage(mirrorTexture, topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
                    context.restore();
                }
            }
        }
    }
}

// export function updateDrawerConfig(config: { cellSize: number }) {
//     cellSize = config.cellSize;
// }
