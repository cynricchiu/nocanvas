import { Stage, PerspectiveCamera, Geometry, Material, Primitive } from '../src/nocanvas';
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
const z = 0;
const cubeGeometry = new Geometry({
	type: 'GL_TRIANGLES',
	positions: [
		[0, 0, z],
		[0, w, z],
		[w, w, z],
		[w, 0, z],
		[0, 0, z - w],
		[0, w, z - w],
		[w, w, z - w],
		[w, 0, z - w],
	],
	// indices: [
	// 	0, 1, 2, 0, 3, 2, 4, 5, 6, 4, 7, 6, 0, 1, 5, 0, 4, 5, 3, 2, 6, 3, 7, 6, 0, 4, 7, 0, 3, 7, 1, 5, 6, 1, 2, 6,
	// ],
	indices: [0, 1, 2, 0, 3, 2, 4, 5, 6, 4, 7, 6],
	colors: [
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
		[255, 0, 0, 255],
	],
});

const material = new Material({
	attributes: {},
	uniforms: {},
	// 顶点着色器
	vert: (index, attributes, uniforms) => {
		const a_position = vec3.fromValues(...attributes['positions'][index]);
		const a_color = vec4.fromValues(...attributes['colors'][index]);
		const u_matrix = mat4.fromValues(...uniforms['matrix']);
		const gl_Position = vec3.transformMat4(vec3.create(), a_position, u_matrix);
		// 保存varyings变量，传递给frag
		const varyings = {};
		varyings['v_color'] = a_color;
		return { gl_Position, gl_PointSize: 1, varyings };
	},
	// 片元着色器
	frag: () => {},
});

const cube = new Primitive(cubeGeometry, material);
stage.add([cube]);
