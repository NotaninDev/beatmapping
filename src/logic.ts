export enum Direction {
    Up,
    Right,
    Down,
    Left
}

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
    position: number[]; // row, column
    direction: Direction;

    constructor(position: number[], direction: Direction) {
        this.position = position;
        this.direction = direction;
    }
}

export class Board {
    size: number[]; // row, column
    cells: Cell[][];
    pulse: Pulse;

    constructor(size: number[], position: number[], direction: Direction) {
        this.size = size;
        this.cells = [];
        for (let i = 0; i < size[0]; i++) {
            this.cells[i] = [];
            for (let j = 0; j < size[1]; j++) {
                this.cells[i][j] = new Cell();
            }
        }
        this.pulse = new Pulse(position, direction);
        this.cells[position[0]][position[1]].generator = direction;
    }

    inMap(position: number[]) {
        return position[0] > 0 && position[0] < this.size[0] - 1 && position[1] > 0 && position[1] < this.size[1] - 1;
    }
}
