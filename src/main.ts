import { Board, Direction, PALETTE, initializeDrawer, drawBoard, drawUi, getMousePositionOnBoard, updateUiHoverState, onMapPlay, onSongPlay, drawToolbox, updateToolHoverState, onMirrorTool, currentTool, switchTool, onBoostTool, startSongTracking, trackAnswer, initializeAudio, initializeScore, score, drawScoreBar, Tool, drawCredits, imageFromName } from "./internal";
import ubuntuUrl from "./fonts/ubuntu-font-family-0.83/Ubuntu-M.ttf";

const canvas = document.querySelector<HTMLCanvasElement>("#game_canvas")!;
const ctx = canvas.getContext("2d")!;

let fontUbuntu = new FontFace("Ubuntu-M", `url(${ubuntuUrl})`);
fontUbuntu.load().then((font) => {
  document.fonts.add(font);
  console.log(`font ready: ${font.family}`);
}, (result) => {
  console.log(`failed loading font Ubuntu: ${result}`);
});

function getBoardCenter() {
  return [canvas.width / 2, canvas.height * 0.41];
}
function getUiCenter() {
  return [canvas.width / 2, canvas.height * 0.89];
}
function getToolboxCenter() {
  return [canvas.width * 0.3, canvas.height * 0.89];
}
function getScoreBarCenter() {
  return [canvas.width * 0.745, canvas.height * 0.89];
}
function getCreditsCenter() {
  return [canvas.width * 0.88, canvas.height * 0.73];
}



export let mousePositionOnBoard: number[] = [0, 0];
export function updateMousePosition(newPosition: number[]) {
    mousePositionOnBoard = newPosition;
}


export let playingMap: boolean = false, playingSong: boolean = false;
export let timestepStart: number = 0;
export const MILLISECOND_PER_TILE: number = 600;
export function stopMap() {
  board.pulse.reset();
  playingMap = false;
  winAchieved = score.isFullScore();
}
export function stopSong() {
  playingSong = false;
}


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

board.cells[1][1].bell = 2;
board.cells[2][2].bell = 1;
board.cells[2][3].bell = 3;
board.cells[2][5].bell = 2;
board.cells[3][1].bell = 1;
board.cells[3][5].bell = 1;
board.cells[4][2].bell = 1;
board.cells[4][6].bell = 1;
board.cells[5][2].bell = 2;
board.cells[5][4].bell = 2;
board.cells[6][2].bell = 3;
board.cells[6][5].bell = 3;
board.cells[7][2].bell = 1;
board.cells[7][3].bell = 1;
board.cells[7][4].bell = 2;
board.cells[8][4].bell = 1;
board.cells[8][5].bell = 1;

initializeScore();

initializeDrawer(90, board);

let boardCenter: number[];
let uiCenter: number[];
let toolboxCenter: number[];
let scoreBarCenter: number[];
let creditsCenter: number[];
function updateCenter(){
  boardCenter = getBoardCenter();
  uiCenter = getUiCenter();
  toolboxCenter = getToolboxCenter();
  scoreBarCenter = getScoreBarCenter();
  creditsCenter = getCreditsCenter();
}
updateCenter();

export let editorMode = false;
function setEditorMode (flag: boolean) {
  editorMode = flag;
  if (flag && !winAchieved) score.reset();
}

let timestepNow = 0;
let blockInput = true;
let winAchieved = false;
// main loop; game logic lives here
function every_frame(cur_timestamp: number) {
  blockInput = false;

  timestepNow = cur_timestamp;

  // handle resize
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    // .clientWidth is the element's real size, .width is a canvas-specific property: the rendering size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    updateCenter();
  }

  // update
  if (playingMap) {
    if (board.pulse.updatePosition(timestepNow - timestepStart)) {
      stopMap();
      blockInput = true;
    }
  }
  if (playingSong) {
    trackAnswer(timestepNow - timestepStart);
  }

  // draw
  ctx.fillStyle = PALETTE[5]; // background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawBoard(ctx, boardCenter, cur_timestamp);
  // drawUi(ctx, uiCenter, cur_timestamp - timestepStart);
  // drawToolbox(ctx, toolboxCenter);
  // drawScoreBar(ctx, scoreBarCenter);
  // if (winAchieved) drawCredits(ctx, creditsCenter);

  requestAnimationFrame(every_frame);
}

document.addEventListener("mousemove", event => {
  updateMousePosition(getMousePositionOnBoard(event, boardCenter));
  updateUiHoverState(event, uiCenter);
  updateToolHoverState(event, toolboxCenter);
});
document.addEventListener("mousedown", _ => {
  if (blockInput) return;
  if (board.inMap(mousePositionOnBoard) && !playingMap) {
    let cell = board.cells[mousePositionOnBoard[0]][mousePositionOnBoard[1]];
    switch (currentTool) {
      case Tool.Mirror:
        if (cell.mirrorUpRight === null) cell.mirrorUpRight = true;
        else if (cell.mirrorUpRight) cell.mirrorUpRight = false;
        else cell.mirrorUpRight = null;
        break;
      case Tool.Boost:
        cell.boost = !cell.boost;
        break;
      case Tool.Bell:
        if (!cell.hasBell()) cell.bell = 1;
        else if (cell.bell === 3) cell.bell = null;
        else cell.bell!++;
        setEditorMode(true);
        break;
    }
    blockInput = true;
    return;
  }
  if (onMapPlay && !playingSong) {
    if (playingMap && score.isFullScore() && !winAchieved) {
      blockInput = true;
      return;
    }
    playingMap = !playingMap;
    if (playingMap) {
      timestepStart = timestepNow + MILLISECOND_PER_TILE / 2;
      startSongTracking(board, -1);
      score.reset();
    }
    else {
      stopMap();
    }
    blockInput = true;
    return;
  }
  if (onSongPlay && !playingMap) {
    playingSong = !playingSong;
    if (playingSong) {
      timestepStart = timestepNow;
      startSongTracking(board, -1);
    }
    blockInput = true;
    return;
  }
  if (onMirrorTool && currentTool != Tool.Mirror && !playingMap) {
    switchTool(Tool.Mirror);
    blockInput = true;
    return;
  }
  if (onBoostTool && currentTool != Tool.Boost && !playingMap) {
    switchTool(Tool.Boost);
    blockInput = true;
    return;
  }
});
document.addEventListener("keydown", event => {
  if (event.repeat || blockInput) return;
  switch (event.code) {
    case "KeyB":
      if (playingMap) return;
      switchTool();
      blockInput = true;
      break;
    case "KeyP":
      if (playingMap && score.isFullScore() && !winAchieved) {
        blockInput = true;
        return;
      }
      playingMap = !playingMap;
      if (playingMap) {
        timestepStart = timestepNow + MILLISECOND_PER_TILE / 2;
        startSongTracking(board, -1);
        score.reset();
      }
      else {
        stopMap();
      }
      blockInput = true;
      break;
  }
});

const soundTexture = await imageFromName('sound icon');
soundTexture.setAttribute("width", "128");
soundTexture.setAttribute("width", "128");

// The loading screen is done in HTML so it loads instantly
const loading_screen_element = document.querySelector<HTMLDivElement>("#loading_screen")!;
const firstLineElement = document.querySelector<HTMLDivElement>("#first_line")!;
const soundIconElement = document.querySelector<HTMLDivElement>("#sound_icon")!;
const secondLineElement = document.querySelector<HTMLDivElement>("#second_line")!;

// By the time we run this code, everything's loaded and we're ready to start
firstLineElement.innerText = "Play with the sound ON";
secondLineElement.innerText = "Click to start!";

soundIconElement.appendChild(soundTexture);

// It's good practice to wait for user input, and also required if your game has sound
document.addEventListener("pointerdown", _event => {
  loading_screen_element.style.opacity = "0";
  firstLineElement.remove();
  secondLineElement.remove();
  soundIconElement.remove();
  soundTexture.remove();
  initializeAudio();
  requestAnimationFrame(every_frame);
}, { once: true });
