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
// for (let i = 0; i < 99; i++) {
// 	const x = random(-300, 300);
// 	const y = random(-300, 300);
// 	const z = random(-300, 300);

// 	positions.push([x, y, z]);
// 	indices.push(i);

// 	const color = [255 * Math.random(), 255 * Math.random(), 255 * Math.random(), 255];
// 	colors.push(color);
// }
positions.push([-100, -100, 100], [100, -100, 100], [0, 200, 100], [-200, 200, 100]);
indices.push(0, 1, 2, 3);
colors.push([255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 0, 0, 255]);

const triangleGeometry = new Geometry({
	// type: 'GL_TRIANGLES',
	// type: 'GL_TRIANGLE_STRIP',
	type: 'GL_TRIANGLE_FAN',
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
		// 保存varyings变量，传递给frag
		const varyings = {};
		varyings['v_color'] = a_color;
		return { gl_Position, varyings };
	},
	// 片元着色器
	frag: (index, varyings) => {},
});
const triangles = new Primitive(triangleGeometry, material);
stage.add([triangles]);

// stage.observe(triangles.id);

function random(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}
