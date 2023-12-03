import { Board, mousePositionOnBoard, playingMap } from "./internal";

function lerp(a: number, b: number, t: number) {
    return a * (1 - t) + b * t;
}

export function imageFromName(fileName: string): Promise<HTMLImageElement> {
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
const bellTextures = [await imageFromName('bell last'), await imageFromName('bell do'), await imageFromName('bell mi'), await imageFromName('bell fa')];
const pulseTextures = [await imageFromName('pulse cw'), await imageFromName('pulse ccw'), await imageFromName('pulse core')];


const NOTE_WAVE_LIFETIME = 400 // in milliseconds
let waveMaxLineWidth: number = 5;
let waveMaxRadius: number, waveMinRadius: number;
export class NoteWave {
    position: number[]; // row, column
    correct: boolean;
    timestepStart: number;
    constructor(position: number[], correct: boolean, timestepGlobal: number) {
        this.position = position;
        this.correct = correct;
        this.timestepStart = timestepGlobal;
    }
}
export let activeNoteWaves: NoteWave[];


let cellSize: number;
let board: Board;
let uiSize: number;
let uiPadding: number;
let toolboxPadding: number;
export function initializeDrawer(cellSizeAttr: number, boardAttr: Board) {
    cellSize = cellSizeAttr;
    board = boardAttr;
    uiSize = cellSize * 1.5;
    uiPadding = cellSize * 0.2;
    toolboxPadding = cellSize * 0.4;
    activeNoteWaves = [];
    waveMaxRadius = cellSize;
    waveMinRadius = cellSize * 0.05;
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
    let x = topLeft[0] + cellSize * (board.pulse.drawPosition[1] + 0.5), y = topLeft[1] + cellSize * (board.pulse.drawPosition[0] + 0.5);
    context.save();
    context.translate(x, y);
    context.rotate(timestepGlobal / 1000 * (-0.6));
    context.translate(-x, -y);
    context.drawImage(pulseTextures[1], topLeft[0] + cellSize * (board.pulse.drawPosition[1] - 0.5), topLeft[1] + cellSize * (board.pulse.drawPosition[0] - 0.5), cellSize * 2, cellSize * 2);
    context.restore();
    context.drawImage(pulseTextures[2], topLeft[0] + cellSize * (board.pulse.drawPosition[1] - 0.5), topLeft[1] + cellSize * (board.pulse.drawPosition[0] - 0.5), cellSize * 2, cellSize * 2);

    while (activeNoteWaves.length > 0 && timestepGlobal >= activeNoteWaves[0].timestepStart + NOTE_WAVE_LIFETIME) {
        activeNoteWaves.shift();
    }
    activeNoteWaves.forEach(noteWave => {
        context.strokeStyle = PALETTE[noteWave.correct ? 8 : 1];
        let t = (timestepGlobal - noteWave.timestepStart) / NOTE_WAVE_LIFETIME;
        context.lineWidth = lerp(waveMaxLineWidth, 0, t);
        context.beginPath();
        context.arc(topLeft[0] + cellSize * (noteWave.position[1] + 0.5), topLeft[1] + cellSize * (noteWave.position[0] + 0.5), lerp(waveMinRadius, waveMaxRadius, t), 0, Math.PI * 2);
        context.stroke();
    });

    // draw bells
    for (let row = 0; row < board.size[0]; row++) {
        for (let column = 0; column < board.size[1]; column++) {
            if (board.cells[row][column].hasBell()) {
                context.drawImage(bellTextures[board.cells[row][column].bell!], topLeft[0] + cellSize * column, topLeft[1] + cellSize * row, cellSize, cellSize);
            }
        }
    }
}

// the return value is [row, column]
export function getMousePositionOnBoard(event: MouseEvent, center: number[]) {
    const topLeft: number[] = [center[0] - cellSize * board.size[1] / 2, center[1]- cellSize * board.size[0] / 2];
    return [Math.floor((event.offsetY - topLeft[1]) / cellSize), Math.floor((event.offsetX - topLeft[0]) / cellSize)];
}

// export function drawUi(context: CanvasRenderingContext2D, center: number[], timestepGlobal: number) {
//     let topLeft: number[] = [center[0] - uiSize - uiPadding / 2, center[1] - uiSize / 2];
//     drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), 0]);
//     drawUiSlice(context, topLeft, [playingSong ? 1 : (onMapPlay ? 2 : 0), playingMap ? 3 : 2]);
//     drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 0]);
//     drawUiSlice(context, [topLeft[0] + uiSize + uiPadding, topLeft[1]], [playingMap ? 1 : (onSongPlay ? 2 : 0), 1], playingSong ? timestepGlobal / 1000 * 0.6 : undefined);
// }

// // the format of sheetCoords is [row, column]
// function drawUiSlice(context: CanvasRenderingContext2D, topLeft: number[], sheetCoords: number[], angle?: number) {
//     if (angle !== undefined) {
//         context.save();
//         context.translate(topLeft[0] + uiSize / 2, topLeft[1] + uiSize / 2);
//         context.rotate(angle);
//         context.translate(-topLeft[0] - uiSize / 2, -topLeft[1] - uiSize / 2);
//     }
//     context.drawImage(UiTexture, 192 * sheetCoords[1], 192 * sheetCoords[0], 192, 192, topLeft[0], topLeft[1], uiSize, uiSize);
//     if (angle !== undefined) {
//         context.restore();
//     }
// }

export let onMapPlay: boolean = false, onSongPlay: boolean = false;
// the return value is [row, column]
export function updateUiHoverState(event: MouseEvent, center: number[]) {
    let uiCenter: number[] = [center[0] - (uiSize + uiPadding) / 2, center[1]];
    onMapPlay = Math.sqrt(Math.pow(event.offsetX - uiCenter[0], 2) + Math.pow(event.offsetY - uiCenter[1], 2)) < uiSize / 2;
    uiCenter = [center[0] + (uiSize + uiPadding) / 2, center[1]];
    onSongPlay = Math.sqrt(Math.pow(event.offsetX - uiCenter[0], 2) + Math.pow(event.offsetY - uiCenter[1], 2)) < uiSize / 2;
}

export enum Tool {
    Mirror,
    Boost,
    Bell
}
export let currentTool: Tool = Tool.Boost;
// export function drawToolbox(context: CanvasRenderingContext2D, center: number[]) {
//     context.fillStyle = PALETTE[playingMap ? 6 : 8];
//     context.strokeStyle = PALETTE[8];
//     context.lineWidth = 1.8;
//     let topLeft: number[] = [center[0] - cellSize - toolboxPadding / 2, center[1] - cellSize / 2];
//     let toolHighlightPadding = toolboxPadding * 0.5;
//     if (currentTool == Tool.Mirror) {
//         context.fillRect(topLeft[0] - toolHighlightPadding / 2, topLeft[1] - toolHighlightPadding / 2, cellSize + toolHighlightPadding, cellSize + toolHighlightPadding);
//     }
//     else if (onMirrorTool && !playingMap) {
//         context.strokeRect(topLeft[0] - toolHighlightPadding / 2, topLeft[1] - toolHighlightPadding / 2, cellSize + toolHighlightPadding, cellSize + toolHighlightPadding);
//     }
//     context.drawImage(mirrorTexture, topLeft[0], topLeft[1], cellSize, cellSize);

//     topLeft = [center[0] + toolboxPadding / 2, center[1] - cellSize / 2];
//     if (currentTool == Tool.Boost) {
//         context.fillRect(topLeft[0] - toolHighlightPadding / 2, topLeft[1] - toolHighlightPadding / 2, cellSize + toolHighlightPadding, cellSize + toolHighlightPadding);
//     }
//     else if (onBoostTool && !playingMap) {
//         context.strokeRect(topLeft[0] - toolHighlightPadding / 2, topLeft[1] - toolHighlightPadding / 2, cellSize + toolHighlightPadding, cellSize + toolHighlightPadding);
//     }
//     context.drawImage(boostTexture, topLeft[0], topLeft[1], cellSize, cellSize);

//     context.fillStyle = PALETTE[1];
//     let boxRadius = toolboxPadding * 0.3;
//     let toolboxPaddingRate = 1;
//     let boxOffset = [cellSize + toolboxPadding * (1 + toolboxPaddingRate) / 2 + boxRadius, (cellSize + toolboxPadding * toolboxPaddingRate) / 2 + boxRadius];
//     let toolboxBox = new Path2D();
//     toolboxBox.moveTo(center[0] - boxOffset[0] + boxRadius, center[1] - boxOffset[1]);
//     toolboxBox.arcTo(center[0] - boxOffset[0], center[1] - boxOffset[1], center[0] - boxOffset[0], center[1] - boxOffset[1] + boxRadius, boxRadius);
//     toolboxBox.arcTo(center[0] - boxOffset[0], center[1] + boxOffset[1], center[0] - boxOffset[0] + boxRadius, center[1] + boxOffset[1], boxRadius);
//     toolboxBox.arcTo(center[0] + boxOffset[0], center[1] + boxOffset[1], center[0] + boxOffset[0], center[1] + boxOffset[1] - boxRadius, boxRadius);
//     toolboxBox.arcTo(center[0] + boxOffset[0], center[1] - boxOffset[1], center[0] + boxOffset[0] - boxRadius, center[1] - boxOffset[1], boxRadius);
//     toolboxBox.closePath();

//     let boxLineWidth = cellSize * 0.05;
//     boxRadius += boxLineWidth;
//     boxOffset = [boxOffset[0] + boxLineWidth, boxOffset[1] + boxLineWidth];
//     let toolTitleOffset = toolboxPadding * 0.9;
//     toolboxBox.moveTo(center[0] - boxOffset[0] + boxRadius, center[1] - boxOffset[1]);
//     toolboxBox.arcTo(center[0] - boxOffset[0] - toolTitleOffset, center[1] - boxOffset[1], center[0] - boxOffset[0] - toolTitleOffset, center[1] - boxOffset[1] + boxRadius, boxRadius);
//     toolboxBox.arcTo(center[0] - boxOffset[0] - toolTitleOffset, center[1] + boxOffset[1], center[0] - boxOffset[0] - toolTitleOffset + boxRadius, center[1] + boxOffset[1], boxRadius);
//     toolboxBox.arcTo(center[0] + boxOffset[0], center[1] + boxOffset[1], center[0] + boxOffset[0], center[1] + boxOffset[1] - boxRadius, boxRadius);
//     toolboxBox.arcTo(center[0] + boxOffset[0], center[1] - boxOffset[1], center[0] + boxOffset[0] - boxRadius, center[1] - boxOffset[1], boxRadius);
//     toolboxBox.closePath();
//     context.fill(toolboxBox, "evenodd");

//     context.font = "15px Ubuntu-M";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.fillStyle = PALETTE[7];
//     let toolTitle = "TOOLS";
//     for (let i = 0; i < 5; i++) {
//         context.fillText(toolTitle[i], center[0] - (boxOffset[0] - boxLineWidth + (boxLineWidth + toolTitleOffset) / 2), center[1] + cellSize * 0.3 * (-2 + i));
//     }

//     if (editorMode) {
//         context.font = "20px Ubuntu-M";
//         context.fillStyle = PALETTE[1];
//         context.fillText("EDITOR", center[0] - boxOffset[0] - cellSize * 1.8, center[1] + cellSize * 0.24);
//         context.fillText("MODE", center[0] - boxOffset[0] - cellSize * 1.8, center[1] - cellSize * 0.24);
//     }
// }

export let onMirrorTool: boolean = false, onBoostTool: boolean = false;
// the return value is [row, column]
export function updateToolHoverState(event: MouseEvent, center: number[]) {
    onMirrorTool = event.offsetX >= center[0] - cellSize - toolboxPadding * (0.5 + 1 / 3) && event.offsetX <= center[0] - toolboxPadding * (0.5 - 1 / 3) && event.offsetY >= center[1] - cellSize / 2 - toolboxPadding / 3 && event.offsetY <= center[1] + cellSize / 2 + toolboxPadding / 3;
    onBoostTool = event.offsetX >= center[0] + toolboxPadding * (0.5 - 1 / 3) && event.offsetX <= center[0] + cellSize + toolboxPadding * (0.5 + 1 / 3) && event.offsetY >= center[1] - cellSize / 2 - toolboxPadding / 3 && event.offsetY <= center[1] + cellSize / 2 + toolboxPadding / 3;
}

export function switchTool(tool?: Tool) {
    if (tool !== undefined) currentTool = tool;
    else {
        switch (currentTool) {
            case Tool.Mirror:
                currentTool = Tool.Boost;
                break;
            case Tool.Boost:
                currentTool = Tool.Bell;
                break;
            case Tool.Bell:
                currentTool = Tool.Mirror;
                break;
        }
    }
}

// const SCORE_ROW = 3, SCORE_COLUMN = 7;
// export function drawScoreBar(context: CanvasRenderingContext2D, center: number[]) {
//     // draw the bar
//     context.fillStyle = PALETTE[1];
//     let barOffset = [(scoreSize + scorePadding) * SCORE_COLUMN / 2 + scorePadding / 3, (scoreSize + scorePadding) * SCORE_ROW / 2 + scorePadding / 3];
//     let scoreBar = new Path2D();
//     let scoreRadius = scorePadding / 2;
//     scoreBar.moveTo(center[0] - barOffset[0] + scoreRadius, center[1] - barOffset[1]);
//     scoreBar.arcTo(center[0] - barOffset[0], center[1] - barOffset[1], center[0] - barOffset[0], center[1] - barOffset[1] + scoreRadius, scoreRadius);
//     scoreBar.arcTo(center[0] - barOffset[0], center[1] + barOffset[1], center[0] - barOffset[0] + scoreRadius, center[1] + barOffset[1], scoreRadius);
//     scoreBar.arcTo(center[0] + barOffset[0], center[1] + barOffset[1], center[0] + barOffset[0], center[1] + barOffset[1] - scoreRadius, scoreRadius);
//     scoreBar.arcTo(center[0] + barOffset[0], center[1] - barOffset[1], center[0] + barOffset[0] - scoreRadius, center[1] - barOffset[1], scoreRadius);
//     scoreBar.closePath();
//     context.fill(scoreBar);

//     // draw each score
//     let topLeft: number[] = [center[0] - (scoreSize + scorePadding) * SCORE_COLUMN / 2 + scorePadding / 2, center[1] - (scoreSize + scorePadding) * SCORE_ROW / 2 + scorePadding / 2];
//     context.fillStyle = PALETTE[7];
//     for (let i = 0; i < score.size; i++) {
//         const row = Math.floor(i / SCORE_COLUMN), column = i % SCORE_COLUMN;
//         const scoreTopLeft = [topLeft[0] + (scoreSize + scorePadding) * column, topLeft[1] + (scoreSize + scorePadding) * row];
//         context.fillRect(scoreTopLeft[0], scoreTopLeft[1], scoreSize, scoreSize);

//         if (i < score.barIndex) {
//             if (score.scoreBar[i]) {
//                 context.strokeStyle = PALETTE[8];
//                 context.lineWidth = 5;
//                 let check = new Path2D();
//                 check.moveTo(scoreTopLeft[0] + scoreSize / 6, scoreTopLeft[1] + scoreSize / 2);
//                 check.lineTo(scoreTopLeft[0] + scoreSize * 2 / 5, scoreTopLeft[1] + scoreSize - scoreSize / 4);
//                 check.lineTo(scoreTopLeft[0] + scoreSize - scoreSize / 5, scoreTopLeft[1] + scoreSize / 5);
//                 context.stroke(check);
//             }
//             else {
//                 context.strokeStyle = PALETTE[2];
//                 context.lineWidth = 5;
//                 let cross = new Path2D();
//                 cross.moveTo(scoreTopLeft[0] + scoreSize / 5, scoreTopLeft[1] + scoreSize / 5);
//                 cross.lineTo(scoreTopLeft[0] + scoreSize - scoreSize / 5, scoreTopLeft[1] + scoreSize - scoreSize / 5);
//                 cross.moveTo(scoreTopLeft[0] + scoreSize / 5, scoreTopLeft[1] + scoreSize - scoreSize / 5);
//                 cross.lineTo(scoreTopLeft[0] + scoreSize - scoreSize / 5, scoreTopLeft[1] + scoreSize / 5);
//                 context.stroke(cross);
//             }
//         }
//     }
// }

// export function drawCredits(context: CanvasRenderingContext2D, center: number[]) {
//     context.font = "20px Ubuntu-M";
//     context.textAlign = "center";
//     context.textBaseline = "middle";
//     context.fillStyle = PALETTE[1];
//     context.fillText("Thank you for", center[0], center[1]);
//     context.fillText("playing!", center[0], center[1] + cellSize * 0.5);

//     let birdSize = cellSize * 1.2;
//     context.drawImage(NotanTexture, center[0] - birdSize / 2, center[1] - birdSize / 2 - cellSize * 0.8, birdSize, birdSize);
// }
