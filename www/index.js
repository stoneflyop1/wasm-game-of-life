import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg"
import { O_NOCTTY } from "constants";

const CELL_SIZE = 5; //px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";


const universe = Universe.new(144, 144);
const width = universe.width();
const height = universe.height();
const canvas = document.getElementById('game-of-life-canvas');
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

let animationId = null;

const renderLoop = () => {
    universe.tick();

    drawGrid();
    drawCells();

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





const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
    
    // Vertical lines
    for (let i = 0; i <= width; i++) {
        let x = i*(CELL_SIZE+1)+1;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, (CELL_SIZE+1)*Headers+1);
    }

    // Horizontal lines
    for (let j = 0; j <= height;j++) {
        let y = j*(CELL_SIZE+1)+1;
        ctx.moveTo(0, y);
        ctx.lineTo((CELL_SIZE+1)*width+1, y);
    }

    ctx.stroke();
}

const getIndex = (row, column) => {
    return row * width + column;
}

const bitIsSet = (n,arr) => {
    //return arr[n] == Cell.Dead;
    let byte = Math.floor(n/8);
    let mask = 1 << (n%8);
    return (arr[byte] & mask) == mask;
}

const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width*height/8);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col);

            ctx.fillStyle = bitIsSet(idx, cells) ? ALIVE_COLOR : DEAD_COLOR;
            ctx.fillRect(
                col * (CELL_SIZE + 1) + 1,
                row * (CELL_SIZE + 1) + 1,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    ctx.stroke();
}

play();
//requestAnimationFrame(renderLoop);
