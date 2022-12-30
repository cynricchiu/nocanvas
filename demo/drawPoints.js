import { Stage, PerspectiveCamera, OrthoCamera, Geometry, Material, Primitive } from '../src/nocanvas';
import { vec3, vec4, mat4 } from '../src/util/gl-matrix-min';

const canvas = document.getElementById('container');
canvas.width = Math.floor(canvas.offsetWidth * 2);
canvas.height = Math.floor(canvas.offsetHeight * 2);
// const stage = new Stage(canvas);

// const camera = new PerspectiveCamera({
// 	fovy: Math.PI / 4,
// 	aspect: canvas.width / canvas.height,
// 	near: 0.01,
// 	far: 1000.0,
// });
// // const camera = new OrthoCamera({
// // 	left: -500,
// // 	right: 500,
// // 	bottom: -500,
// // 	top: 500,
// // 	near: 0.01,
// // 	far: 1000.0,
// // });

// camera.lookAt({
// 	center: [0, 0, 0],
// 	eye: [0, 0, 800],
// });
// stage.setCamera(camera);

// const w = 200;
// const z = 100;

// const positions = [];
// const colors = [];
// const indices = [];
// // for (let i = 0; i < 1000; i++) {
// // 	const x = random(-300, 300);
// // 	const y = random(-300, 300);
// // 	const z = 1000;
// // 	positions.push([x, y, z]);
// // 	indices.push(i);
// // 	colors.push([255 * Math.random(), 255 * Math.random(), 255 * Math.random(), 255]);
// // }
// positions.push([10, 0, 100], [0, 0, 1000]);
// indices.push(0, 1);
// colors.push([255, 0, 0, 255], [0, 0, 255, 255]);

// const pointsGeometry = new Geometry({
// 	type: 'GL_POINTS',
// 	positions,
// 	colors,
// 	indices,
// 	// positions: [
// 	// 	[0, 0, z],
// 	// 	[0, w, z],
// 	// 	[w, w, z],
// 	// 	[w, 0, z],
// 	// 	[0, 0, z - w],
// 	// 	[0, w, z - w],
// 	// 	[w, w, z - w],
// 	// 	[w, 0, z - w],
// 	// ],
// 	// indices: [0, 1, 2, 3, 4, 5, 6, 7],
// 	// colors: [
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// 	[255, 0, 0, 255],
// 	// ],
// });

// const material = new Material({
// 	attributes: {},
// 	uniforms: {
// 		width: canvas.width,
// 		height: canvas.height,
// 	},
// 	// 顶点着色器
// 	vert: (index, vbo, uniforms) => {
// 		const a_position = vec4.fromValues(...vbo['positions'][index], 1);
// 		const a_color = vec4.fromValues(...vbo['colors'][index]);
// 		const u_mvpMatrix = mat4.fromValues(...uniforms['mvpMatrix']);
// 		const gl_Position = vec4.transformMat4(a_position, a_position, u_mvpMatrix);
// 		const gl_PointSize = 40;
// 		// 保存varyings变量，传递给frag
// 		const varyings = {};
// 		varyings['v_color'] = a_color;
// 		return { gl_Position, gl_PointSize, varyings };
// 	},
// 	// 片元着色器
// 	frag: (index, varyings) => {},
// });
// // const points = new Primitive(pointsGeometry, material);
// // stage.add([points]);

// window.points = points;
// window.stage = stage;

// stage.observe(points.id);

function random(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

// const worker = new Worker('./worker.js');
// worker.postMessage({ name: 'loadWasm', args: [] });

const loadWebAssembly = async (path, importObject = {}) => {
	const { instance, module } = await WebAssembly.instantiateStreaming(fetch(path), importObject);
	window.module = module;
	return instance;
};

const instance = await loadWebAssembly('../src/renderer/wasm/main.wasm');

const { init, memory, createColorBuffer, drawCircle, clearRect } = instance.exports;

const ctx = canvas.getContext('2d');
// const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
console.log(`WASM分配内存:${memory.buffer.byteLength / 1024 / 1024}M`);
const width = canvas.width;
const height = canvas.height;

init(width, height);
clearRect();
const offsetColorBuffer = createColorBuffer(width, height);
const colorArray = new Uint8ClampedArray(memory.buffer, offsetColorBuffer, width * height * 4);
const imageData = new ImageData(colorArray, width, height);

let r = 0;
const render = () => {
	window.requestAnimationFrame(render);
	imageData.data.fill(0);
	if (r++ >= 200) {
		r = 0;
	}
	drawCircle(canvas.width / 2, canvas.height / 2, r, 255, 0, 0, 255);
	ctx.putImageData(imageData, 0, 0);
};

window.requestAnimationFrame(render);
