/// <reference path="../types/game.d.ts" />
/// <reference path="../types/wasm.d.ts" />

/**
 * @type {CanvasRenderingContext2D} 
 */
let ctx;
/**
 * @type {Game.Universe}
 */
let universe;
/**
 * @type {number}
 */
let width;
/**
 * @type {number}
 */
let height;

const CELL_SIZE = 5; //px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

//import util from './util.js'
import {getIndex, bitIsSet} from './util.js';
/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {Game.Universe} universe1
 * @param {WebAssembly.Memory} memory 
 */
export function draw(canvas, universe1, memory) {
    if (!universe) {
        universe = universe1;
        width = universe.width();
        height = universe.height();
    }

    if (!ctx) {
        ctx = canvas.getContext('2d');
        canvas.height = (CELL_SIZE + 1) * height + 1;
        canvas.width = (CELL_SIZE + 1) * width + 1;
        canvas.addEventListener('click', event => {
            const boundingRect = canvas.getBoundingClientRect();
            
            const scaleX = canvas.width / boundingRect.width;
            const scaleY = canvas.height / boundingRect.height;

            const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
            const canvasTop = (event.clientY - boundingRect.top) * scaleY;

            const row = Math.min(Math.floor(canvasTop / (CELL_SIZE+1)), height - 1);
            const col = Math.min(Math.floor(canvasLeft/(CELL_SIZE+1)), width - 1);

            universe.set_glider(row, col);
            //universe.toggle_cell(row, col);

            drawGrid();
            drawCells();
        });
    }
    

    const drawGrid = () => {
        ctx.beginPath();
        ctx.strokeStyle = GRID_COLOR;
        
        // Vertical lines
        for (let i = 0; i <= width; i++) {
            let x = i*(CELL_SIZE+1)+1;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, (CELL_SIZE+1)*height+1);
        }

        // Horizontal lines
        for (let j = 0; j <= height;j++) {
            let y = j*(CELL_SIZE+1)+1;
            ctx.moveTo(0, y);
            ctx.lineTo((CELL_SIZE+1)*width+1, y);
        }

        ctx.stroke();
    }
    const drawStateCells = (cells, isAlive) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const idx = getIndex(row, col, width);

                if (bitIsSet(idx, cells) != isAlive) {
                    continue;
                }

                ctx.fillStyle = isAlive ? ALIVE_COLOR : DEAD_COLOR;
                ctx.fillRect(
                    col * (CELL_SIZE + 1) + 1,
                    row * (CELL_SIZE + 1) + 1,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }
    const drawCells = () => {
        const cellsPtr = universe.cells();
        const cells = new Uint8Array(memory.buffer, cellsPtr, width*height/8);

        ctx.beginPath();

        drawStateCells(cells, true);

        drawStateCells(cells, false);
        ctx.stroke();
    }
    drawGrid();
    drawCells();
}
