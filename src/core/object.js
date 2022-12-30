import { vec3, mat4 } from '../util/gl-matrix-min';

/**
 * 物体
 */
export class Object3D {
	constructor() {
		this.stage = null;
		this.state = {
			position: vec3.fromValues(0, 0, 0), // 世界坐标系中的位置
			modelMatrix: mat4.identity(new Float32Array(16)), // 模型变换矩阵：模型坐标系-世界坐标系
		};
	}

	// 平移(即设置位置)
	_translate(dx, dy, dz) {
		this.state.position = vec3.fromValues(dx, dy, dz);
		mat4.translate(this.state.modelMatrix, this.state.modelMatrix, this.state.position);
	}

	// 欧拉角旋转(单位：度)，顺序xyz
	_rotate(ax, ay, az) {
		const rx = (Math.PI / 180) * ax;
		const ry = (Math.PI / 180) * ay;
		const rz = (Math.PI / 180) * az;
		if (rx !== 0) {
			mat4.rotateX(this.state.modelMatrix, this.state.modelMatrix, rx);
		}
		if (ry !== 0) {
			mat4.rotateY(this.state.modelMatrix, this.state.modelMatrix, ry);
		}
		if (rz !== 0) {
			mat4.rotateZ(this.state.modelMatrix, this.state.modelMatrix, rz);
		}
	}

	// 四元数旋转(单位：度)
	_rotateByQuat(x, y, z, angle) {
		// 0向量有Bug
		if (angle !== 0 && (x !== 0 || y !== 0 || z !== 0)) {
			const rad = (Math.PI / 180) * angle;
			// glmatrix直接提供了矩阵绕轴旋转算法，本质和四元数一样，但是更快
			const matrix = mat4.fromRotation(mat4.create(), rad, vec3.fromValues(x, y, z));
			mat4.multiply(this.state.modelMatrix, matrix, this.state.modelMatrix);
			// 四元数
			// const quotation = quat.setAxisAngle(quat.create(), vec3.fromValues(x, y, z), rad);
			// const matrix = mat4.fromQuat(mat4.create(), quotation);
			// mat4.multiply(this.state.modelMatrix, matrix, this.state.modelMatrix);
		}
	}

	// 缩放
	_scale(sx, sy, sz) {
		mat4.scale(this.state.modelMatrix, this.state.modelMatrix, vec3.fromValues(sx, sy, sz));
	}

	// 保存状态
	_save() {
		const state = {};
		for (let key in this.state) {
			const value = this.state[key];
			if (value instanceof Float32Array) {
				state[key] = new Float32Array(value);
			} else if (value instanceof Array) {
				state[key] = [...value];
			} else {
				state[key] = value;
			}
		}
		this.saveState = state;
	}

	// 恢复状态
	_restore() {
		this.state = this.saveState;
	}
}
