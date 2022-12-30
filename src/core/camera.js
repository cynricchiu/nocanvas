import { vec3, mat4 } from '../util/gl-matrix-min';
import { clamp } from '../util/math';

/**
 * 相机
 */
export class Camera {
	constructor(eye, center, up) {
		this.stage = null;
		this.state = {
			eye: vec3.fromValues(...(eye || [0, 0, 0])), // 相机位置
			center: vec3.fromValues(...(center || [0, 0, 0])), // 焦点位置
			up: vec3.fromValues(...(up || [0, 1, 0])), // 头顶朝向
			viewMatrix: mat4.identity(new Float32Array(16)), // 视图变换矩阵：世界坐标系-相机坐标系
			projectionMatrix: mat4.identity(new Float32Array(16)), // 裁剪变换矩阵：相机坐标系-裁剪坐标系
		};
	}

	// 调整相机参数
	lookAt = ({ eye, center, up }) => {
		if (eye) {
			this.state.eye = vec3.fromValues(...eye);
		}
		if (center) {
			this.state.center = vec3.fromValues(...center);
		}
		if (up) {
			this.state.up = vec3.fromValues(...up);
		}
		this._updateViewMatrix();
	};

	// 更新相机
	update = () => {
		this._updateViewMatrix();
		this._updateProjectionMatrix();
	};

	// 调整相机距离(eye距离center的位置)
	zoom = stepZoom => {
		const { distance, eye, center, near, far } = this.state;
		const deltaScale = (Math.log(far) - Math.log(near)) / 10; // 缩放级别变化幅度
		let deltaDis = Math.pow(10, deltaScale); // 缩放距离变化
		deltaDis = stepZoom < 0 ? -deltaDis : deltaDis;
		let newDis = distance + deltaDis;
		if (far !== undefined && near !== undefined) {
			newDis = clamp(newDis, near, far);
		}
		const focus = vec3.lerp(vec3.create(), center, eye, (newDis - distance) / distance);
		this.state.eye = vec3.add(eye, eye, focus);
		this._updateViewMatrix();
	};

	// 保存相机状态
	save = () => {
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
	};

	// 恢复相机状态
	restore = () => {
		this.state = this.saveState;
	};

	// 改变相机位置eye
	// 欧拉角旋转(单位：度)，顺序xyz
	rotate = (ax, ay, az) => {
		const { eye } = this.state;
		const rx = (Math.PI / 180) * ax;
		const ry = (Math.PI / 180) * ay;
		const rz = (Math.PI / 180) * az;
		const m = mat4.identity(new Float32Array(16));
		if (rx !== 0) {
			mat4.rotateX(m, m, rx);
		}
		if (ry !== 0) {
			mat4.rotateY(m, m, ry);
		}
		if (rz !== 0) {
			mat4.rotateZ(m, m, rz);
		}
		this.state.eye = vec3.transformMat4(eye, eye, m);
		this._updateViewMatrix();
	};

	// 更新视图变换矩阵
	_updateViewMatrix() {
		const { eye, center, up } = this.state;
		this.state.viewMatrix = mat4.lookAt(mat4.create(), eye, center, up);
		this.state.distance = vec3.distance(eye, center);
	}

	// 更新投影变换矩阵
	_updateProjectionMatrix() {}

	// 添加至stage
	_addToStage(stage) {
		if (this.stage && this.stage.id !== stage.id) {
			return; // 相机只能绑定一个stage
		}
		stage.camera = this;
		return this;
	}
}

/**
 * 透视相机
 */
export class PerspectiveCamera extends Camera {
	constructor(props) {
		super();
		this.state = {
			...this.state,
			fovy: props?.fovy || Math.PI / 4,
			aspect: props?.aspect || 1,
			near: props?.near || 0.01,
			far: props?.far || 1000.0,
		};
		this.update();
	}

	_updateProjectionMatrix() {
		const { fovy, aspect, near, far } = this.state;
		this.state.projectionMatrix = mat4.perspective(mat4.create(), fovy, aspect, near, far);
	}
}

/**
 * 正射相机
 */
export class OrthoCamera extends Camera {
	constructor(props) {
		super();
		this.state = {
			...this.state,
			left: props?.left || -500,
			right: props?.right || 500,
			bottom: props?.bottom || -500,
			top: props?.top || 500,
			near: props?.near || 0.01,
			far: props?.far || 1000.0,
		};
		this.update();
	}

	_updateProjectionMatrix() {
		const { left, right, bottom, top, near, far } = this.state;
		this.state.projectionMatrix = mat4.orthoNO(mat4.create(), left, right, bottom, top, near, far);
	}
}
