import { Board, Direction, PALETTE, initializeDrawer, drawBoard, drawUi, getMousePositionOnBoard } from "./internal";

const canvas = document.querySelector<HTMLCanvasElement>("#game_canvas")!;
const ctx = canvas.getContext("2d")!;

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
  return [canvas.width / 2, canvas.height / 2];
}
function getUiCenter() {
  return [canvas.width / 2, canvas.height * 0.93];
}



export let mousePositionOnBoard: number[] = [0, 0];
export function updateMousePosition(newPosition: number[]) {
    mousePositionOnBoard = newPosition;
}


export let playingMap: boolean = false, playingSong: boolean = false;
export function playMap() {
    playingMap = true;
    playingSong = false;
}
export function playSong() {
    playingSong = true;
    playingMap = false;
}
export function pauseAnySong() {
    playingMap = false;
    playingSong = false;
}
export let timestepStart: number = 0;


// initialize the board
let board = new Board([10, 10]);
for (let i = 0; i < 10; i++) {
  board.cells[0][i].mirrorUpRight = i % 2 == 0;
  board.cells[9][i].mirrorUpRight = i % 2 == 1;
  board.cells[i][0].mirrorUpRight = i % 2 == 0;
  board.cells[i][9].mirrorUpRight = i % 2 == 1;
}
board.cells[9][4].mirrorUpRight = null;
board.cells[9][4].generator = Direction.Up;
board.cells[9][5].mirrorUpRight = null;
board.cells[9][5].bell = 0;
board.pulsePosition = [4, 9];

board.cells[1][2].boost = true
board.cells[1][3].boost = true
board.cells[2][2].boost = true
board.cells[2][3].boost = true
board.cells[3][5].boost = true
board.cells[3][1].boost = true

board.cells[2][3].mirrorUpRight = false;
board.cells[3][4].mirrorUpRight = true;

initializeDrawer(40, board);

let last_timestamp = 0;
let boardCenter = getBoardCenter();
let uiCenter = getUiCenter();
// main loop; game logic lives here
function every_frame(cur_timestamp: number) {
  // in seconds
  let delta_time = (cur_timestamp - last_timestamp) / 1000;
  last_timestamp = cur_timestamp;

  // handle resize
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    // .clientWidth is the element's real size, .width is a canvas-specific property: the rendering size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    boardCenter = getBoardCenter();
    uiCenter = getUiCenter();
  }

  // update
  // to do: implement this

  // draw
  ctx.fillStyle = PALETTE[5]; // background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBoard(ctx, boardCenter, cur_timestamp);
  drawUi(ctx, uiCenter, cur_timestamp - timestepStart);

  requestAnimationFrame(every_frame);
}

document.addEventListener("mousemove", event => {
  updateMousePosition(getMousePositionOnBoard(event, boardCenter));
});
document.addEventListener("mousedown", event => {
  updateMousePosition(getMousePositionOnBoard(event, boardCenter));
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
