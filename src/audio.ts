import { Board, MILLISECOND_PER_TILE, NoteWave, activeNoteWaves, stopSong, timestepStart } from "./internal";

const audioContext = new window.AudioContext();

let drumSound = new Audio("./sounds/drum.wav");
export function playDrum() {
    drumSound.play();
}

let clickSound = new Audio("./sounds/click.wav");
export function playClick() {
    clickSound.play();
}

let boingSounds: HTMLAudioElement[];
const BOING_DELAY = 30;
export function playBoing() {
    setTimeout(() => {
        if (!boingSounds[0].paused) {
            boingSounds[0].pause();
            boingSounds[0].load();
        }
        else boingSounds[0].play();
        [boingSounds[0], boingSounds[1]] = [boingSounds[1], boingSounds[0]];
    }, BOING_DELAY);
}

const noteFrequencies = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.50] as const;
function playNote(index: number) {
    const oscillator = new OscillatorNode(audioContext, {
        type: "sine",
        frequency: noteFrequencies[index]
    });
    const gainNode = new GainNode(audioContext, {gain: 0.12});
    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5 * 0.9 * MILLISECOND_PER_TILE / 1000);
}

export const SONG_ANSWER = [1, null, 2, null, 1, null, null, null, null, null, 1, 3, null, 2, 1, null, 1, null, 2, null, 1, null, null, null, null, null, 1, 3, null, 2, 1, null, 1, null, null, 2, null, null, 1, null, null, 3, null, null, 2, null, null, 1, 0, null] as const;
export function ringBell(bell: number) {
    switch (bell) {
        case 0:
            playNote(7);
            break;
        case 1:
            playNote(0);
            break;
        case 2:
            playNote(2);
            break;
        case 3:
            playNote(3);
            break;
    }
}

class SongTracker {
    lastTick: number;

    constructor(initialTick?: number) {
        this.lastTick = (initialTick === undefined) ? 0 : initialTick;
    }

    tick(timestep: number) {
        let currentTick = Math.floor(timestep * 2 / MILLISECOND_PER_TILE);
        if (currentTick > this.lastTick) {
            this.lastTick++;
            return true;
        }
        return false;
    }
}
let songTracker: SongTracker;
let board: Board;

export function initializeAudio() {
    boingSounds = [new Audio("./sounds/boing.wav"), new Audio("./sounds/boing.wav")];
    boingSounds[0].volume = 0.8;
    boingSounds[1].volume = 0.8;
}

export function startSongTracking(boardAttr: Board, initialTick?: number) {
    board = boardAttr;
    songTracker = new SongTracker(initialTick);
}
export function trackAnswer(timestep: number) {
    if (songTracker.tick(timestep)) {
        if (songTracker.lastTick >= SONG_ANSWER.length) {
            stopSong();
            return;
        }
        else if (songTracker.lastTick >= 0 && SONG_ANSWER[songTracker.lastTick] !== null) {
            ringBell(SONG_ANSWER[songTracker.lastTick]!);
            for (let row = 0; row < board.size[0]; row++) {
                for (let column = 0; column < board.size[1]; column++) {
                    if (board.cells[row][column].hasBell() && board.cells[row][column].bell === SONG_ANSWER[songTracker.lastTick]) {
                        activeNoteWaves.push(new NoteWave([row, column], timestep + timestepStart));
                    }
                }
            }
        }
        if (isClickFrame()) {
            playClick();
        }
    }
}
// returns true if the tracker ticked
export function tickMap(timestep: number) {
    return songTracker.tick(timestep);
}

export function isClickFrame() { return songTracker.lastTick % 2 == 0; }
export function getCurrentTick() { return songTracker.lastTick; }
