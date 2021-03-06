/// <reference path="types/game.d.ts" />
/// <reference path="types/wasm.d.ts" />

import { Universe } from "wasm-game-of-life";
//import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
//import { O_NOCTTY } from "constants";

/**
 * @type {Game.Universe}
 */
let universe = Universe.new(64, 64);
const canvas = document.getElementById('game-of-life-canvas');

import fps from './fps';

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
