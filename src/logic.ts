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
    size: [number, number]; // row, column
    cells: Cell[][];
    pulsePosition: [number, number] = [0, 0];

    constructor(size: [number, number]) {
        this.size = size;
        this.cells = [];
        for (let i = 0; i < size[0]; i++) {
            this.cells[i] = [];
            for (let j = 0; j < size[1]; j++) {
                this.cells[i][j] = new Cell();
            }
        }
    }
}
