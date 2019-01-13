/// <reference path="types/game.d.ts" />
/// <reference path="types/wasm.d.ts" />

import { Universe } from "wasm-game-of-life";
//import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg"
//import { O_NOCTTY } from "constants";

/**
 * @type {Game.Universe}
 */
let universe = Universe.new(64, 64);
const canvas = document.getElementById('game-of-life-canvas');

const fps = new class {
    constructor() {
        this.fps = document.getElementById('fps');
        this.frames = [];
        this.lastFrameTimeStamp = performance.now();
    }

    render() {
        const now = performance.now();
        const delta = now - this.lastFrameTimeStamp;
        this.lastFrameTimeStamp = now;
        const fps = 1 / delta * 1000;

        // save only the latest 100 timings
        this.frames.push(fps);
        if (this.frames.length > 100) {
            this.frames.shift();
        }

        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        for (let i = 0; i < this.frames.length; i++) {
            sum += this.frames[i];
            min = Math.min(this.frames[i], min);
            max = Math.max(this.frames[i], max);
        }
        let mean = sum / this.frames.length;

        this.fps.textContent = `
        Frames per Second:
latest =${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
        `.trim();
    }
}

let animationId = null;

// import {draw} from './lib/draw2d.js';
import {draw} from './lib/drawGL.js';

const renderLoop = () => {

    fps.render();

    universe.tick();

    draw(canvas, universe, memory);

    animationId = requestAnimationFrame(renderLoop);
}

const isPaused = () => {
    return animationId == null;
}

const playPauseButton = document.getElementById('play-pause');

const play = () => {
    playPauseButton.textContent = "⏸";
    animationId = requestAnimationFrame(renderLoop);
    //renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
};

playPauseButton.addEventListener('click', event => {
    if (isPaused()) play();
    else pause();
});

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', function() {
    //universe = Universe.new(64,64);
    universe.reset();
});


play();
//requestAnimationFrame(renderLoop);
