/// <reference path="../types/game.d.ts" />
/// <reference path="../types/wasm.d.ts" />

/**
 * @type {Game.Universe}
 */
let universe;
/**
 * @type {WebGLRenderingContext}
 */
let gl;
/**
 * @type {WebGLProgram}
 */
let program;
/**
 * @type {number}
 */
let width;
/**
 * @type {number}
 */
let height;
/**
 * @type {number} point size
 */
const CELL_SIZE = 5.0; //px
/**
 * @type {number} delta x
 */
let dx;
/**
 * @type {number} delta y
 */
let dy;
/**
 * vertex shader
 */
const vs = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = 3.0;
            v_Color = a_Color;
        }
`;
/**
 * fragment shader
 */
const fs = `
        precision mediump float;
        varying vec4 v_Color;
        void main() {
            gl_FragColor = v_Color;
        }
`;
/**
 * @type {Float32Array}
 */
let vertices;

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
        vertices = new Float32Array(height*width*5);
    }

    
    getVertices(memory, vertices);

    const n = vertices.length / 5;

    if (!gl) {
        canvas.height = (CELL_SIZE) * height;
        canvas.width = (CELL_SIZE) * width;
        dx = 2.0 / width;
        dy = 2.0 / height;
        gl = canvas.getContext('webgl');
        program = initShaders(gl, vs, fs);

        if (!program) return null;

        // background color
        initColor(gl, 0.0,0.0,0.0,1.0);
        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

    }

    initVertexBuffers(gl, program, vertices, 5);
    
    const startIndex = 0;
    const drawNumber = n - startIndex;
    gl.drawArrays(gl.POINTS, startIndex, drawNumber); 

}

/**
 * 
 * @param {number} row 
 * @param {number} col
 * @returns {{x:number, y:number}}
 */
function getVertex(row, col) {
    const x = -0.99 + row * dx;
    const y = 0.99 - col * dy;
    return {
        x:x, y:y
    };
}

/**
 * 
 * @param {WebAssembly.Memory} memory 
 */
function getVertices(memory, vertices) {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width*height/8);
    //let numbers = [];
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const idx = getIndex(row, col, width);
            const v = getVertex(row, col);
            const index = idx*5;
            vertices[index] = v.x;
            vertices[index+1] = v.y;
            if (bitIsSet(idx, cells)) {
                vertices.set([0.0,0.0,0.0], index+2);
                //numbers = numbers.concat([v.x,v.y, 0.0,0.0,0.0]);
            } else {
                vertices.set([1.0,1.0,1.0], index+2);
                //numbers = numbers.concat([v.x,v.y, 1.0,1.0,1.0]);
            }
        }
    }
    //return new Float32Array(numbers);
}


/**
 * initialize vertext and fragment shaders
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {String} vs vertext shader string
 * @param {String} fs fragment shader string
 * @param {Boolean} noUseProgram not use the created program immediately
 * @returns {WebGLProgram} webgl context program
 */
function initShaders(gl, vs, fs, noUseProgram) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    if (vertexShader == null) return null;
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
    if (fragmentShader == null) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const err = 'Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram);
        gl.deleteProgram(program);
        gl.deleteShader(fragmentShader);
        gl.deleteShader(vertexShader);
        console.error(err);
        return null;
    }

    if (!noUseProgram) {
        gl.useProgram(program);
    }    

    return program;
}

/**
 * load webgl shader with type
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Number} type webgl shader type
 * @param {String} source webgl shader source
 * @returns {WebGLShader} compiled webgl shader
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const err = 'An error occurred compiling the shaders: ' + 
        gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        console.error(err);
        return null;
    }
    return shader;
}

/**
 * initialize color for webgl context
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Number} r red: 0.0 ~ 1.0
 * @param {Number} g green: 0.0 ~ 1.0
 * @param {Number} b blue: 0.0 ~ 1.0
 * @param {Number} a alpha: 0.0 ~ 1.0
 */
function initColor(gl, r, g, b, a) {
    r = r || 0.0;
    g = g || 0.0;
    b = b || 0.0;
    a = a || 0.0;
    gl.clearColor(r,g,b,a);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {WebGLProgram} program 
 * @param {Float32Array} vertices
 */
function initVertexBuffers(gl, program, vertices, nCoordinates) {

    const n = Math.floor(vertices.length/nCoordinates);

    const vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const FSIZE = vertices.BYTES_PER_ELEMENT;
    const a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    const a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
    gl.enableVertexAttribArray(a_Color);

    return n;
}