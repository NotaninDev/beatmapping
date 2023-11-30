import { MILLISECOND_PER_TILE, stopSong } from "./internal";

const audioContext = new window.AudioContext();

let drumSound = new Audio("./sounds/drum.wav");
export function playDrum() {
    drumSound.play();
}

let clickSound = new Audio("./sounds/click.wav");
export function playClick() {
    clickSound.play();
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

export const SONG_ANSWER = [1, null, 2, null, 1, null, null, null, null, null, 1, 3, null, 2, 1, null, 1, null, 2, null, 1, null, null, null, null, null, 1, 3, null, 2, 1, null, 0] as const;
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
            this.lastTick = currentTick;
            return true;
        }
        return false;
    }
}
let songTracker: SongTracker;

export function startSongTracking(initialTick?: number) {
    songTracker = new SongTracker(initialTick);
}
export function trackAnswer(timestep: number) {
    if (songTracker.tick(timestep)) {
        if (songTracker.lastTick >= SONG_ANSWER.length) {
            stopSong();
        }
        else if (songTracker.lastTick >= 0 && SONG_ANSWER[songTracker.lastTick] !== null) {
            ringBell(SONG_ANSWER[songTracker.lastTick]!);
        }
        if (songTracker.lastTick % 2 == 0) {
            playClick();
        }
    }
}
