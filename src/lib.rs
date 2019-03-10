extern crate cfg_if;
extern crate wasm_bindgen;
extern crate js_sys;

mod utils;

mod webgl;

use cfg_if::cfg_if;

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

use wasm_bindgen::prelude::*; // enable wasm_bingen attribute

#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn log(msg: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn time(name: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn timeEnd(name: &str);
}

#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = performance)]
    fn now() -> f64;
}

// // A macro to provide `println!(..)`-style syntax for `console.log` logging.
// macro_rules! log {
//     ($($t:tt)*) => (log(&format!($($t)*)))
// }

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        time(name); // console.time()
        Timer {name}
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        timeEnd(self.name)
    }
}

// #[wasm_bindgen]
// #[repr(u8)]
// #[derive(Clone, Copy, Debug, PartialEq, Eq)]
// pub enum Cell {
//     Dead = 0,
//     Alive = 1,
// }

// impl Cell {
//     fn toggle(&mut self) {
//         *self = match *self {
//             Cell::Dead => Cell::Alive,
//             Cell::Alive => Cell::Dead,
//         };
//     }
// }

extern crate fixedbitset;

use fixedbitset::FixedBitSet;

/// represents a life universe with width and height
#[wasm_bindgen]
pub struct Universe {
    /// the width of the universe
    width: u32,
    /// the height of the universe
    height: u32,
    cells: FixedBitSet,
    ncells: FixedBitSet
}

#[wasm_bindgen]
impl Universe {
    /// a frame tick record
    pub fn tick(&mut self) {

        let _timer = Timer::new("Universe::tick");

        // let mut next = {
        //     let _timer = Timer::new("allocate next cells");
        //     self.cells.clone()
        // };

        {
            let _timer = Timer::new("new generation");
            for row in 0..self.height {
                for col in 0..self.width {
                    let idx = self.get_index(row, col);
                    let cell = self.cells[idx];
                    let live_neighbors = self.live_neighbor_count(row, col);
                    let next_cell = match (cell, live_neighbors) {
                        // Rule 1: Any live cell with fewer than two live neighbors dies,
                        // as if caused by underpopulation
                        (true, x) if x < 2 => false,
                        // Rule 2: Any live cell with 2 or 3 live neighbors lives on to the next generation.
                        (true, 2) | (true, 3) => true,
                        // Rule 3: Any live cell with more than 3 live neighbors dies, as if by overpopulation.
                        (true, x) if x > 3 => false,
                        // Rule 4: Any dead cell with exactly 3 live neighbors becomes a live cell,
                        // as if by reproduction
                        (false, 3) => true,
                        // All other cells remain in the same state.
                        (otherwise, _) => otherwise,
                    };              
                    //next.set(idx, next_cell);
                    self.ncells.set(idx, next_cell);
                }
            }
        }

        let _timer = Timer::new("set old cells");
        for i in 0..self.ncells.len() {
            self.cells.set(i as usize, self.ncells[i]);
        }
        //self.cells = next;
    }
    /// reset the universe with random cells
    pub fn reset(&mut self) {
        for i in 0..self.cells.len() {
            if js_sys::Math::random() >= 0.5 {
                self.cells.set(i as usize, true);
                self.ncells.set(i as usize, true);
            } else {
                self.cells.set(i as usize, false);
                self.ncells.set(i as usize, false);
            }
        }
    }
    /// create a universe with specified width and height
    pub fn new(width: u32, height: u32) -> Universe {

        utils::set_panic_hook();

        if width <= 0{
            panic!("width is not positive");
        }
        if height <= 0 {
            panic!("height is not positive");
        }

        // let width = 64;
        // let height = 64;

        // let mut size = 1;

        // while size*size < width {
        //     size += 1
        // }

        // size -= 1;

        let mut cells = FixedBitSet::with_capacity((width*height) as usize);
        for i in 0..cells.len() {
            if js_sys::Math::random() >= 0.5 {
                cells.set(i as usize, true);
            }
        }
        let mut ncells = FixedBitSet::with_capacity((width*height) as usize);
        for i in 0..ncells.len() {
            ncells.set(i as usize, cells[i]);
        }

        Universe{width, height, cells, ncells}
    }
    /// get the render string
    pub fn render(&self) -> String {
        self.to_string()
    }
    /// get the universe width
    pub fn width(&self) -> u32 {
        self.width
    }
    /// get the universe height
    pub fn height(&self) -> u32 {
        self.height
    }
    /// get the universe cells
    pub fn cells(&self) -> *const u32 {
        self.ncells.as_slice().as_ptr()
    }
    /// reverse the cell state
    pub fn toggle_cell(&mut self, row: u32, column: u32) {
        let idx = self.get_index(row, column);
        let ok = self.cells[idx];
        self.cells.set(idx, !ok);
    }
    /// set a glider with centered position
    pub fn set_glider(&mut self, center_row: u32, center_col: u32) {
        if center_row >=2 && center_col >= 2 {
            let start_index = self.get_index(center_row-2, center_col-2);
            let end_index = self.get_index(center_row+2, center_col+2);
            self.cells.set_range(start_index..end_index, false);
            for idx in start_index..end_index {
                let mut enabled = false;
                if idx == self.get_index(center_row-1, center_col-1)
                    || idx == self.get_index(center_row, center_col)
                    || idx == self.get_index(center_row, center_col+1)
                    || idx == self.get_index(center_row+1, center_col-1)
                    || idx == self.get_index(center_row+1, center_col) {
                    enabled = true;
                }
                self.cells.set(idx, enabled);
            }

        }
    }
}

impl Universe {

    pub fn get_cells(&self) -> &FixedBitSet {
        &self.cells
    }

    pub fn get_index(&self, row: u32, column: u32) -> usize {
        (row * self.width + column) as usize
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8 {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned() {
            for delta_col in [self.width - 1, 0, 1].iter().cloned() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }
                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[idx] as u8;
            }
        }
        count
    }
}

use std::fmt;

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.as_slice().chunks(self.width as usize) {
            for &cell in line {
                let symbol = if cell == 0 { '◻' } else {'◼'};
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }
        Ok(())
    }
}