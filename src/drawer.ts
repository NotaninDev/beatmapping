import { Board, mousePositionOnBoard, playingMap, playingSong } from "./internal";

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
let toolboxPadding: number;
export function initializeDrawer(cellSizeAttr: number, boardAttr: Board) {
    cellSize = cellSizeAttr;
    board = boardAttr;
    uiSize = cellSize * 1.5;
    uiPadding = cellSize * 0.2
    toolboxPadding = cellSize * 0.4
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
    if (board.inMap(mousePositionOnBoard) && !playingMap) {
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
    drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), 0]);
    drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), playingMap ? 3 : 2]);
    drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 0]);
    drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 1], playingSong ? timestepGlobal / 1000 * 0.6 : undefined);
}

// the format of sheetCoords is [row, column]
function drawUiSlice(context: CanvasRenderingContext2D, topLeft: number[], sheetCoords: number[], angle?: number) {
    if (angle !== undefined) {
        context.save();
        context.translate(topLeft[0] + uiSize / 2, topLeft[1] + uiSize / 2);
        context.rotate(angle);
        context.translate(-topLeft[0] - uiSize / 2, -topLeft[1] - uiSize / 2);
    }
    context.drawImage(UiTexture, 192 * sheetCoords[1], 192 * sheetCoords[0], 192, 192, topLeft[0], topLeft[1], uiSize, uiSize);
    if (angle !== undefined) {
        context.restore();
    }
}

export let onMapPlay: boolean = false, onSongPlay: boolean = false;
// the return value is [row, column]
export function updateUiHoverState(event: MouseEvent, center: number[]) {
    let uiCenter: number[] = [center[0] - (uiSize + uiPadding) / 2, center[1]];
    onMapPlay = Math.sqrt(Math.pow(event.offsetX - uiCenter[0], 2) + Math.pow(event.offsetY - uiCenter[1], 2)) < uiSize / 2;
    uiCenter = [center[0] + (uiSize + uiPadding) / 2, center[1]];
    onSongPlay = Math.sqrt(Math.pow(event.offsetX - uiCenter[0], 2) + Math.pow(event.offsetY - uiCenter[1], 2)) < uiSize / 2;
}

export let toolIsBoost: boolean = true;
export function drawToolbox(context: CanvasRenderingContext2D, center: number[]) {
    context.fillStyle = PALETTE[playingMap ? 6 : 8];
    context.strokeStyle = PALETTE[8];
    let topLeft: number[] = [center[0] - cellSize - toolboxPadding / 2, center[1] - cellSize / 2];
    if (!toolIsBoost) {
        context.fillRect(topLeft[0] - toolboxPadding / 3, topLeft[1] - toolboxPadding / 3, cellSize + toolboxPadding * 2 / 3, cellSize + toolboxPadding * 2 / 3);
    }
    else if (onMirrorTool && !playingMap) {
        context.strokeRect(topLeft[0] - toolboxPadding / 3, topLeft[1] - toolboxPadding / 3, cellSize + toolboxPadding * 2 / 3, cellSize + toolboxPadding * 2 / 3);
    }
    context.drawImage(mirrorTexture, topLeft[0], topLeft[1], cellSize, cellSize);

    topLeft = [center[0] + toolboxPadding / 2, center[1] - cellSize / 2];
    if (toolIsBoost) {
        context.fillRect(topLeft[0] - toolboxPadding / 3, topLeft[1] - toolboxPadding / 3, cellSize + toolboxPadding * 2 / 3, cellSize + toolboxPadding * 2 / 3);
    }
    else if (onBoostTool && !playingMap) {
        context.strokeRect(topLeft[0] - toolboxPadding / 3, topLeft[1] - toolboxPadding / 3, cellSize + toolboxPadding * 2 / 3, cellSize + toolboxPadding * 2 / 3);
    }
    context.drawImage(boostTexture, topLeft[0], topLeft[1], cellSize, cellSize);

    // drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), 0]);
    // drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), playingMap ? 3 : 2]);
    // drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 0]);
    // drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 1], playingSong ? timestepGlobal / 1000 * 0.6 : undefined);
}

export let onMirrorTool: boolean = false, onBoostTool: boolean = false;
// the return value is [row, column]
export function updateToolHoverState(event: MouseEvent, center: number[]) {
    onMirrorTool = event.offsetX >= center[0] - cellSize - toolboxPadding * (0.5 + 1 / 3) && event.offsetX <= center[0] - toolboxPadding * (0.5 - 1 / 3) && event.offsetY >= center[1] - cellSize / 2 - toolboxPadding / 3 && event.offsetY <= center[1] + cellSize / 2 + toolboxPadding / 3;
    onBoostTool = event.offsetX >= center[0] + toolboxPadding * (0.5 - 1 / 3) && event.offsetX <= center[0] + cellSize + toolboxPadding * (0.5 + 1 / 3) && event.offsetY >= center[1] - cellSize / 2 - toolboxPadding / 3 && event.offsetY <= center[1] + cellSize / 2 + toolboxPadding / 3;
}

export function switchTool() {
    toolIsBoost = !toolIsBoost;
}
