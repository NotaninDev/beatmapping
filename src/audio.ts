import { MILLISECOND_PER_TILE } from "./internal";

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
export function playNote(index: number) {
    const oscillator = new OscillatorNode(audioContext, {
        type: "sine",
        frequency: noteFrequencies[index]
    });
    const gainNode = new GainNode(audioContext, {gain: 0.12});
    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5 * 0.9 * MILLISECOND_PER_TILE / 1000);
}
