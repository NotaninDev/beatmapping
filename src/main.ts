import { Board, Direction, PALETTE, initializeDrawer, drawBoard, drawUi, getMousePositionOnBoard, updateUiHoverState, onMapPlay, onSongPlay, drawToolbox, updateToolHoverState, onMirrorTool, toolIsBoost, switchTool, onBoostTool } from "./internal";

const canvas = document.querySelector<HTMLCanvasElement>("#game_canvas")!;
const ctx = canvas.getContext("2d")!;

let fontUbuntu = new FontFace("Ubuntu-M", "url(./fonts/ubuntu-font-family-0.83/Ubuntu-M.ttf)");
fontUbuntu.load().then((font) => {
  document.fonts.add(font);
  console.log(`font ready: ${font.family}`);
}, (result) => {
  console.log(`failed loading font Ubuntu: ${result}`);
});

// from https://www.fabiofranchino.com/log/load-an-image-with-javascript-using-await/
export function imageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // to avoid CORS if used with Canvas
    img.src = url
    img.onload = () => {
      resolve(img);
    }
    img.onerror = e => {
      reject(e);
    }
  })
}

function getBoardCenter() {
  return [canvas.width / 2, canvas.height * 0.42];
}
function getUiCenter() {
  return [canvas.width / 2, canvas.height * 0.89];
}
function getToolboxCenter() {
  return [canvas.width * 0.3, canvas.height * 0.89];
}



export let mousePositionOnBoard: number[] = [0, 0];
export function updateMousePosition(newPosition: number[]) {
    mousePositionOnBoard = newPosition;
}


export let playingMap: boolean = false, playingSong: boolean = false;
export let timestepStart: number = 0;
export const MILLISECOND_PER_TILE: number = 600;


// initialize the board
let board = new Board([10, 10], [9, 4], Direction.Up, [9, 5]);
for (let i = 0; i < 10; i++) {
  board.cells[0][i].mirrorUpRight = i % 2 == 0;
  board.cells[9][i].mirrorUpRight = i % 2 == 1;
  board.cells[i][0].mirrorUpRight = i % 2 == 0;
  board.cells[i][9].mirrorUpRight = i % 2 == 1;
}
board.cells[board.pulse.defaultPosition[0]][board.pulse.defaultPosition[1]].mirrorUpRight = null;
board.cells[board.lastBell[0]][board.lastBell[1]].mirrorUpRight = null;

board.cells[3][4].bell = 1;
board.cells[8][4].bell = 1;
board.cells[7][5].bell = 1;

initializeDrawer(45, board);

let timestepNow = 0;
let blockInput = false;
let boardCenter = getBoardCenter();
let uiCenter = getUiCenter();
let toolboxCenter = getToolboxCenter();
// main loop; game logic lives here
function every_frame(cur_timestamp: number) {
  blockInput = false;

  // in seconds
  let delta_time = (cur_timestamp - timestepNow) / 1000;
  timestepNow = cur_timestamp;

  // handle resize
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    // .clientWidth is the element's real size, .width is a canvas-specific property: the rendering size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    boardCenter = getBoardCenter();
    uiCenter = getUiCenter();
    toolboxCenter = getToolboxCenter();
  }

  // update
  if (playingMap) {
    if (board.pulse.updatePosition(timestepNow - timestepStart)) {
      board.pulse.reset();
      playingMap = false;
      blockInput = true;
    }
  }

  // draw
  ctx.fillStyle = PALETTE[5]; // background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBoard(ctx, boardCenter, cur_timestamp);
  drawUi(ctx, uiCenter, cur_timestamp - timestepStart);
  drawToolbox(ctx, toolboxCenter);

  requestAnimationFrame(every_frame);
}

document.addEventListener("mousemove", event => {
  updateMousePosition(getMousePositionOnBoard(event, boardCenter));
  updateUiHoverState(event, uiCenter);
  updateToolHoverState(event, toolboxCenter);
});
document.addEventListener("mousedown", event => {
  if (blockInput) return;
  if (board.inMap(mousePositionOnBoard) && !playingMap) {
    let cell = board.cells[mousePositionOnBoard[0]][mousePositionOnBoard[1]];
    if (toolIsBoost) {
      cell.boost = !cell.boost;
    }
    else {
      if (cell.mirrorUpRight === null) cell.mirrorUpRight = true;
      else if (cell.mirrorUpRight) cell.mirrorUpRight = false;
      else cell.mirrorUpRight = null;
    }
    blockInput = true;
    return;
  }
  if (onMapPlay && !playingSong) {
    playingMap = !playingMap;
    if (playingMap) {
      timestepStart = timestepNow;
    }
    else {
      board.pulse.reset();
    }
    blockInput = true;
    return;
  }
  if (onSongPlay && !playingMap) {
    playingSong = !playingSong;
    if (playingSong) {
      timestepStart = timestepNow;
    }
    blockInput = true;
    return;
  }
  if ((onMirrorTool && toolIsBoost || onBoostTool && !toolIsBoost) && !playingMap) {
    switchTool();
    blockInput = true;
    return;
  }
});

// The loading screen is done in HTML so it loads instantly
const loading_screen_element = document.querySelector<HTMLDivElement>("#loading_screen")!;

// By the time we run this code, everything's loaded and we're ready to start
loading_screen_element.innerText = "Press to start!";
// It's good practice to wait for user input, and also required if your game has sound
document.addEventListener("pointerdown", _event => {
  loading_screen_element.style.opacity = "0";
  requestAnimationFrame(every_frame);
}, { once: true });
