/**
 * get Index from row, col
 * 
 * @param {Number} row row index
 * @param {Number} column column index
 * @param {Number} width canvas width
 * @returns {Number} array index
 */
export function getIndex(row, column, width) {
    return row * width + column;
}
/**
 * check whether the bit is setted
 * 
 * @param {Number} n row index
 * @param {Array<Number>} arr column index
 * @returns {Boolean} if set, true
 */
export function bitIsSet(n,arr) {
    //return arr[n] == Cell.Dead;
    let byte = Math.floor(n/8);
    let mask = 1 << (n%8);
    return (arr[byte] & mask) == mask;
}

export default {
    getIndex, bitIsSet
};