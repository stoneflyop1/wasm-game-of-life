
// https://rustwasm.github.io/docs/wasm-bindgen/examples/webgl.html
use js_sys::WebAssembly;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{WebGlProgram, WebGlRenderingContext, WebGlShader};

use crate::*;

#[wasm_bindgen]
pub struct App {
    width: u32,
    height: u32,
    universe: Universe,
    gl: WebGlRenderingContext,
    program: WebGlProgram,
}

#[wasm_bindgen]
impl App {
    pub fn new(width: u32, height: u32) -> Result<App, JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();
        let canvas = document.get_element_by_id("game-of-life-canvas").unwrap();
        let canvas: web_sys::HtmlCanvasElement = canvas.dyn_into::<web_sys::HtmlCanvasElement>()?;
        let cell_size = 5;
        canvas.set_height(cell_size * height);
        canvas.set_width(cell_size * width);
        let gl = canvas.get_context("webgl")?.unwrap().dyn_into::<WebGlRenderingContext>()?;
        let vs = r#"
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        void main() {
            gl_Position = a_Position;
            gl_PointSize = 3.0;
            v_Color = a_Color;
        }"#;

        let fs = r#"
        precision mediump float;
        varying vec4 v_Color;
        void main() {
            gl_FragColor = v_Color;
        }"#;

        let program = init_shaders(&gl, vs, fs)?;
        Ok(App {
            width: width,
            height: height,
            universe: Universe::new(width, height),
            gl: gl,
            program: program,
        })

    }

    pub fn reset(&mut self) -> Result<(), JsValue> {
        self.universe.reset();
        Ok(())
    }

    pub fn tick(&mut self) {
        self.universe.tick();
    }

    pub fn start(&self) -> Result<(), JsValue> {

        let width = self.width;
        let height = self.height;

        let w = width as f32;
        let h = height as f32;

        let universe = &self.universe;
        let gl = &self.gl;
        let program = &self.program;

        let dx = 2.0 / w;
        let dy = 2.0 / h;

        let cells = universe.get_cells();

        let mut vertices: Vec<f32> = Vec::new();
        for row in 0..width {
            for col in 0..height {
                let index = (row * width + col) as usize;
                let v = get_vertex(row, col, dx, dy);
                vertices.push(v.0);
                vertices.push(v.1);
                let ok = cells[index];
                if ok {
                    vertices.push(0.0);
                    vertices.push(0.0);
                    vertices.push(0.0);
                } else {
                    vertices.push(1.0);
                    vertices.push(1.0);
                    vertices.push(1.0);
                }
            }
        }

        let memory_buffer = wasm_bindgen::memory()
            .dyn_into::<WebAssembly::Memory>()?
            .buffer();
        let vertices_location = vertices.as_ptr() as u32 / 4;
        let vert_array = js_sys::Float32Array::new(&memory_buffer)
            .subarray(vertices_location, vertices_location + vertices.len() as u32);

        gl.clear_color(0.0, 0.0, 0.0, 1.0);
        gl.clear(WebGlRenderingContext::COLOR_BUFFER_BIT);


        init_vertex_buffers(&gl, &program, &vert_array, 5)?;

        gl.draw_arrays(WebGlRenderingContext::POINTS, 0, (vertices.len() / 5) as i32);

        Ok(())

    }
}




fn get_vertex(row: u32, col: u32, dx: f32, dy: f32) -> (f32,f32) {
    (-0.98 + (row as f32) * dx, 0.98 - (col as f32) * dy )
}

fn init_shaders(gl: &WebGlRenderingContext, vs: &str, fs: &str) -> Result<WebGlProgram, String> {
    let vertex_shader = load_shader(gl, WebGlRenderingContext::VERTEX_SHADER, vs)?;
    let fragment_shader = load_shader(gl, WebGlRenderingContext::FRAGMENT_SHADER, fs)?;

    let program = gl.create_program().ok_or_else(|| String::from("Unable to create shader program"))?;
    gl.attach_shader(&program, &vertex_shader);
    gl.attach_shader(&program, &fragment_shader);
    gl.link_program(&program);

    if gl.get_program_parameter(&program, WebGlRenderingContext::LINK_STATUS).as_bool().unwrap_or(false) {
        gl.use_program(Some(&program));
        Ok(program)
    } else {
        Err(gl.get_program_info_log(&program).unwrap_or_else(|| "Unknown error linking program".into()))
    }
}


fn load_shader(gl: &WebGlRenderingContext, shader_type: u32, source: &str) 
    -> Result<WebGlShader, String> {
    let shader = gl.create_shader(shader_type).ok_or_else(|| String::from("Unable to create shader object"))?;
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);

    if gl.get_shader_parameter(&shader, WebGlRenderingContext::COMPILE_STATUS).as_bool().unwrap_or(false) {
        Ok(shader)
    } else {
        Err(gl.get_shader_info_log(&shader)
        .unwrap_or_else(|| "Unknown error creating shader".into()))
    }
}

fn init_vertex_buffers(gl: &WebGlRenderingContext, 
    program: &WebGlProgram, 
    vertices: &js_sys::Float32Array, n_coord: u32) -> Result<u32, String> {

    let n =  vertices.length()/n_coord;

    let vertex_color_buffer = gl.create_buffer().ok_or("failed to create buffer")?;
    gl.bind_buffer(WebGlRenderingContext::ARRAY_BUFFER, Some(&vertex_color_buffer));
    gl.buffer_data_with_array_buffer_view(WebGlRenderingContext::ARRAY_BUFFER, &vertices, WebGlRenderingContext::STATIC_DRAW);

    let f_size = 4; //js_sys::Float32Array::BYTES_PER_ELEMENT;
    let a_position = gl.get_attrib_location(&program, "a_Position") as u32;
    gl.vertex_attrib_pointer_with_i32(a_position, 2, WebGlRenderingContext::FLOAT, false, f_size * 5, 0);
    gl.enable_vertex_attrib_array(a_position);

    let a_color = gl.get_attrib_location(&program, "a_Color") as u32;
    gl.vertex_attrib_pointer_with_i32(a_color, 3, WebGlRenderingContext::FLOAT, false, f_size*5, f_size*2);
    gl.enable_vertex_attrib_array(a_color);

    Ok(n)
}


