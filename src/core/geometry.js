/**
 * 几何属性
 */

export class Geometry {
	constructor(props) {
		this.type = props?.type || 'GL_POINTS'; //支持类型：GL_POINTS|GL_LINE_STRIP|GL_TRIANGLES
		this.positions = props?.positions || []; // 顶点数组
		this.indices = props?.indices || []; // 顶点顺序
		this.colors = props?.colors || []; // 颜色数组
		this.normals = props?.normals || []; // 法向量数组
	}
}
