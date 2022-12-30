import { Stage, PerspectiveCamera, OrthoCamera, Geometry, Material, Primitive } from '../src/nocanvas';
import { vec3, vec4, mat4 } from '../src/util/gl-matrix-min';

const canvas = document.getElementById('container');
const stage = new Stage(canvas);

const camera = new PerspectiveCamera({
	fovy: Math.PI / 4,
	aspect: canvas.width / canvas.height,
	near: 0.01,
	far: 1000.0,
});
camera.lookAt({
	center: [0, 0, 0],
	eye: [0, 0, 800],
});
stage.setCamera(camera);

const w = 200;
const z = 100;

const positions = [];
const colors = [];
const indices = [];
for (let i = 0; i < 100; i++) {
	const x = random(-300, 300);
	const y = random(-300, 300);
	const z = random(-300, 300);

	positions.push([x, y, z]);
	indices.push(i);

	const color = [255 * Math.random(), 255 * Math.random(), 255 * Math.random(), 255];
	colors.push(color);
}

const linesGeometry = new Geometry({
	type: 'GL_LINES',
	// type: 'GL_LINE_STRIP',
	// type: 'GL_LINE_LOOP',
	positions,
	colors,
	indices,
});

const material = new Material({
	attributes: {},
	uniforms: {},
	// 顶点着色器
	vert: (index, vbo, uniforms) => {
		const a_position = vec4.fromValues(...vbo['positions'][index], 1);
		const a_color = vec4.fromValues(...vbo['colors'][index]);
		const u_mvpMatrix = mat4.fromValues(...uniforms['mvpMatrix']);
		const gl_Position = vec4.transformMat4(a_position, a_position, u_mvpMatrix);
		const gl_PointSize = 10;
		// 保存varyings变量，传递给frag
		const varyings = {};
		varyings['v_color'] = a_color;
		return { gl_Position, gl_PointSize, varyings };
	},
	// 片元着色器
	frag: (index, varyings) => {},
});
const lines = new Primitive(linesGeometry, material);
stage.add([lines]);

// stage.observe(lines.id);

function random(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}
