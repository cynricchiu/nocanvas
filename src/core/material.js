/**
 * 材质属性
 */

export class Material {
	constructor(props) {
		this.attributes = props?.attributes || {};
		this.uniforms = props?.uniforms || {};
		this.vert =
			props?.vert ||
			((index, vbo, uniforms) => {
				const position = vbo['position'][index];
				return { gl_Position: position, gl_PointSize: 1, varyings: {} };
			});
		this.frag = props?.frag || ((index, varyings) => {});
	}
}
