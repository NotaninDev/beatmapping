import { Board, mousePositionOnBoard } from "./internal";

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

export const PALETTE = ["#0e0e12", "#1a1a24", "#333346", "#535373", "#8080a4", "#a6a6bf", "#c1c1d2", "#e6e6ec", "#efaa1b"] as const;

const boostTexture = await imageFromName('boost');
const mirrorTexture = await imageFromName('mirror');
const pulseTextures = [await imageFromName('pulse cw'), await imageFromName('pulse ccw'), await imageFromName('pulse core')];
const UiTexture = await imageFromName('UI');



let cellSize: number;
let board: Board;
let uiSize: number;
let uiPadding: number;
export function initializeDrawer(cellSizeAttr: number, boardAttr: Board) {
    cellSize = cellSizeAttr;
    board = boardAttr;
    uiSize = cellSize * 1.5;
    uiPadding = cellSize * 0.2
}


export function drawBoard(context: CanvasRenderingContext2D, center: number[], timestepGlobal: number) {
    const topLeft: number[] = [center[0] - cellSize * board.size[1] / 2, center[1]- cellSize * board.size[0] / 2];

    context.fillStyle = PALETTE[5];
    context.fillRect(topLeft[0], topLeft[1], cellSize * board.size[1], cellSize * board.size[0]);

    // draw tiles
    context.fillStyle = PALETTE[6];
    context.strokeStyle = PALETTE[7];
    context.lineWidth = 1.8;
    for (let row = 0; row < board.size[0]; row++) {
        for (let column = 0; column < board.size[1]; column++) {
            let onEdge = row == 0 || row == board.size[0] - 1 || column == 0 || column == board.size[1] - 1;
            if ((row + column) % 2 == 0) {
                context.fillRect(topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
            if (onEdge) {
                context.strokeRect(topLeft[0] + cellSize * (column + 0.12), topLeft[1] + cellSize * (row + 0.12), cellSize * 0.76, cellSize * 0.76);
            }
            if (board.cells[row][column].boost) {
                context.drawImage(boostTexture, topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
        }
    }
    context.strokeStyle = PALETTE[8];
    if (mousePositionOnBoard[1] > 0 && mousePositionOnBoard[1] < board.size[1] - 1 && mousePositionOnBoard[0] > 0 && mousePositionOnBoard[0] < board.size[0] - 1) {
        context.strokeRect(topLeft[0] + cellSize * (mousePositionOnBoard[1] + 0.12), topLeft[1] + cellSize * (mousePositionOnBoard[0] + 0.12), cellSize * 0.76, cellSize * 0.76);
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

    // draw pulse
    let x = topLeft[0] + cellSize * (board.pulsePosition[0] + 0.5), y = topLeft[1] + cellSize * (board.pulsePosition[1] + 0.5);
    context.save();
    context.translate(x, y);
    context.rotate(timestepGlobal / 1000);
    context.translate(-x, -y);
    context.drawImage(pulseTextures[0], topLeft[0] + cellSize * (board.pulsePosition[0] - 0.5), topLeft[1] + cellSize * (board.pulsePosition[1] - 0.5), cellSize * 2, cellSize * 2);
    context.translate(x, y);
    context.rotate(timestepGlobal / 1000 * (-1 - 0.6));
    context.translate(-x, -y);
    context.drawImage(pulseTextures[1], topLeft[0] + cellSize * (board.pulsePosition[0] - 0.5), topLeft[1] + cellSize * (board.pulsePosition[1] - 0.5), cellSize * 2, cellSize * 2);
    context.restore();
    context.drawImage(pulseTextures[2], topLeft[0] + cellSize * (board.pulsePosition[0] - 0.5), topLeft[1] + cellSize * (board.pulsePosition[1] - 0.5), cellSize * 2, cellSize * 2);
}

// the return value is [row, column]
export function getMousePositionOnBoard(event: MouseEvent, center: number[]) {
    const topLeft: number[] = [center[0] - cellSize * board.size[1] / 2, center[1]- cellSize * board.size[0] / 2];
    return [Math.floor((event.offsetY - topLeft[1]) / cellSize), Math.floor((event.offsetX - topLeft[0]) / cellSize)];
}

export function drawUi(context: CanvasRenderingContext2D, center: number[], timestepGlobal: number) {
    let topLeft: number[] = [center[0] - uiSize - uiPadding / 2, center[1] - uiSize / 2];
    drawUiSlice(context, topLeft, [0, 0]);
    drawUiSlice(context, topLeft, [0, 2]);
    drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [0, 0]);
    drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [0, 1]);
}

// the format of sheetCoords is [row, column]
function drawUiSlice(context: CanvasRenderingContext2D, topLeft: number[], sheetCoords: number[], angle?: number) {
    if (angle !== undefined) {
        context.save();
        context.translate(topLeft[0], topLeft[1]);
        context.rotate(angle);
        context.translate(-topLeft[0], -topLeft[1]);
    }
    context.drawImage(UiTexture, 192 * sheetCoords[1], 192 * sheetCoords[0], 192, 192, topLeft[0], topLeft[1], uiSize, uiSize);
    if (angle !== undefined) {
        context.restore();
    }
}
