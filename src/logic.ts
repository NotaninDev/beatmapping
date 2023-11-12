class Cell {
    boost: boolean = false;
    mirrorUpRight: null | boolean = false;
    bell: null | number = null;

    hasMirror(): boolean {
        return this.mirrorUpRight !== null;
    }
    hasBell(): boolean {
        return this.bell !== null;
    }
}
