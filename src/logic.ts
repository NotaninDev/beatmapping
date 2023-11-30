import { MILLISECOND_PER_TILE, NoteWave, activeNoteWaves, getCurrentTick, isClickFrame, playClick, ringBell, tickMap, timestepStart } from "./internal";

export enum Direction {
    Up,
    Right,
    Down,
    Left
}
const directionVectors = [[-1, 0], [0, 1], [1, 0], [0, -1]];

class Cell {
    boost: boolean = false;
    mirrorUpRight: null | boolean = null;
    bell: null | number = null;
    generator: null | Direction = null;

    hasMirror(): boolean {
        return this.mirrorUpRight !== null;
    }
    hasBell(): boolean {
        return this.bell !== null;
    }
}

class Pulse {
    board: Board;
    defaultPosition: number[]; // row, column
    defaultDirection: Direction;
    drawPosition: number[]; // row, column
    logicPosition: number[]; // row, column
    direction: Direction;
    lastTimeStep: number;
    beatCount: number;
    beatCountEnd: number | null;

    constructor(board: Board, position: number[], direction: Direction) {
        this.board = board;
        this.defaultPosition = position;
        this.defaultDirection = direction;
        this.logicPosition = this.drawPosition = position;
        this.direction = direction;
        this.lastTimeStep = 0;
        this.beatCount = -1;
        this.beatCountEnd = null;
    }

    reset() {
        this.logicPosition = this.drawPosition = this.defaultPosition;
        this.direction = this.defaultDirection;
        this.lastTimeStep = 0;
        this.beatCount = -1;
        this.beatCountEnd = null;
    }

    nextDirection() {
        let cell = this.board.cells[this.logicPosition[0]][this.logicPosition[1]];
        if (cell.hasMirror()) {
            switch (this.direction) {
                case Direction.Up:
                    return cell.mirrorUpRight ? Direction.Right : Direction.Left;
                case Direction.Right:
                    return cell.mirrorUpRight ? Direction.Up : Direction.Down;
                case Direction.Down:
                    return cell.mirrorUpRight ? Direction.Left : Direction.Right;
                case Direction.Left:
                    return cell.mirrorUpRight ? Direction.Down : Direction.Up;
            }
        }
        return this.direction;
    }
    move1Tile() {
        this.direction = this.nextDirection();
        this.logicPosition = [this.logicPosition[0] + directionVectors[this.direction][0], this.logicPosition[1] + directionVectors[this.direction][1]];
    }

    // return value is if the pulse reached the last bell
    updatePosition(timestep: number) {
        let clickNow = false;
        while (tickMap(timestep)) {
            let nextBeatCount = this.beatCount + (this.board.cells[this.logicPosition[0]][this.logicPosition[1]].boost ? 0.5 : 1);
            if (typeof(this.beatCountEnd) === "number" && nextBeatCount >= this.beatCountEnd) break;
            clickNow ||= isClickFrame();
            let pulseMoved = nextBeatCount <= getCurrentTick() / 2;

            // check the song

            if (!pulseMoved) continue;

            this.move1Tile();
            if (this.board.cells[this.logicPosition[0]][this.logicPosition[1]].hasBell()) {
                ringBell(this.board.cells[this.logicPosition[0]][this.logicPosition[1]].bell!);
                activeNoteWaves.push(new NoteWave([this.logicPosition[0], this.logicPosition[1]], timestep + timestepStart));
            }
            this.beatCount = nextBeatCount;
            if (this.beatCountEnd === null && this.logicPosition[0] == this.board.lastBell[0] && this.logicPosition[1] == this.board.lastBell[1]) {
                this.beatCountEnd = nextBeatCount + 1;
            }
        }
        if (clickNow) playClick();

        // update pulse draw position
        if (typeof(this.beatCountEnd) === "number" && timestep >= (this.beatCountEnd - 0.5) * MILLISECOND_PER_TILE) {
            this.drawPosition = this.logicPosition;
        }
        else {
            let offsetRate = (timestep / MILLISECOND_PER_TILE - this.beatCount) / (this.board.cells[this.logicPosition[0]][this.logicPosition[1]].boost ? 0.5 : 1);
            let offsetDirection = offsetRate < 0.5 ? this.direction : this.nextDirection();
            this.drawPosition = [this.logicPosition[0] + directionVectors[offsetDirection][0] * (offsetRate - 0.5), this.logicPosition[1] + directionVectors[offsetDirection][1] * (offsetRate - 0.5)];
        }

        this.lastTimeStep = timestep;
        return typeof(this.beatCountEnd) === "number" && timestep >= this.beatCountEnd * MILLISECOND_PER_TILE;
    }
}

export class Board {
    size: number[]; // row, column
    cells: Cell[][];
    pulse: Pulse;
    lastBell: number[];

    constructor(size: number[], position: number[], direction: Direction, lastBell: number[]) {
        this.size = size;
        this.cells = [];
        for (let i = 0; i < size[0]; i++) {
            this.cells[i] = [];
            for (let j = 0; j < size[1]; j++) {
                this.cells[i][j] = new Cell();
            }
        }
        this.pulse = new Pulse(this, position, direction);
        this.cells[position[0]][position[1]].generator = direction;
        this.lastBell = lastBell;
        this.cells[lastBell[0]][lastBell[1]].bell = 0;
    }

    inMap(position: number[]) {
        return position[0] > 0 && position[0] < this.size[0] - 1 && position[1] > 0 && position[1] < this.size[1] - 1;
    }
}
