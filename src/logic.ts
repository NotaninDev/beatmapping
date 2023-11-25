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

export class Board {
    size: number[]; // row, column
    cells: Cell[][];
    pulsePosition: number[] = [0, 0];

    constructor(size: number[]) {
        this.size = size;
        this.cells = [];
        for (let i = 0; i < size[0]; i++) {
            this.cells[i] = [];
            for (let j = 0; j < size[1]; j++) {
                this.cells[i][j] = new Cell();
            }
        }
    }

    inMap(position: number[]) {
        return position[0] > 0 && position[0] < this.size[0] - 1 && position[1] > 0 && position[1] < this.size[1] - 1
    }
}
