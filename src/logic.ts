import { MILLISECOND_PER_TILE } from "./main";

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
    position: number[]; // row, column
    logicPosition: number[]; // row, column
    direction: Direction;
    lastTimestep: number;
    beatCount: number;

    constructor(board: Board, position: number[], direction: Direction) {
        this.board = board;
        this.defaultPosition = position;
        this.defaultDirection = direction;
        this.logicPosition = this.position = position;
        this.direction = direction;
        this.lastTimestep = 0;
        this.beatCount = -0.5;
    }

    reset() {
        this.logicPosition = this.position = this.defaultPosition;
        this.direction = this.defaultDirection;
        this.lastTimestep = 0;
        this.beatCount = -0.5;
    }

    move1Tile() {
        let cell = this.board.cells[this.logicPosition[0]][this.logicPosition[1]];
        if (cell.hasMirror()) {
            switch (this.direction) {
                case Direction.Up:
                    this.direction = cell.mirrorUpRight ? Direction.Right : Direction.Left;
                    break;
                case Direction.Right:
                    this.direction = cell.mirrorUpRight ? Direction.Up : Direction.Down;
                    break;
                case Direction.Down:
                    this.direction = cell.mirrorUpRight ? Direction.Left : Direction.Right;
                    break;
                case Direction.Left:
                    this.direction = cell.mirrorUpRight ? Direction.Down : Direction.Up;
                    break;
            }
        }
        this.logicPosition = [this.logicPosition[0] + directionVectors[this.direction][0], this.logicPosition[1] + directionVectors[this.direction][1]];
    }

    // return value is if the pulse reached the last bell
    updatePosition(timestep: number) {
        while (!(this.logicPosition[0] == this.board.lastBell[0] && this.logicPosition[1] == this.board.lastBell[1])) {
            let nextBeatCount = this.beatCount + (this.board.cells[this.logicPosition[0]][this.logicPosition[1]].boost ? 0.5 : 1);
            if (timestep < nextBeatCount * MILLISECOND_PER_TILE) break;

            this.move1Tile();
            this.beatCount = nextBeatCount;
        }
        this.position = this.logicPosition;
        this.lastTimestep = timestep;
        return this.logicPosition[0] == this.board.lastBell[0] && this.logicPosition[1] == this.board.lastBell[1] && timestep >= (this.beatCount + 0.5) * MILLISECOND_PER_TILE;
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
