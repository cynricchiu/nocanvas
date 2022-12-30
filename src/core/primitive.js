import { Geometry } from '../core/geometry';
import { Material } from './material';
import { Object3D } from '../core/object';
import { getUUID } from '../util/util';
import { mat4 } from '../util/gl-matrix-min';

// 基本图元
export class Primitive extends Object3D {
	constructor(geometry, material) {
		super();
		this.stage = null; // 绑定的stage
		this.id = `${getUUID(6, 16)}`;
		this.type = geometry.type;
		this._updateProps({
			geometry,
			material,
		});
	}

	// 复制
	clone = () => {
		return new Primitive(this.geometry, this.material);
	};

	// 变换后将modelMatrix作为uniforms变量传入shader
	// 平移
	translate = (dx, dy, dz) => {
		this._translate(dx, dy, dz);
		if (this.stage) {
			const camera = this.stage.camera;
			const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
			mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
			this._updateProps({
				uniforms: {
					mvpMatrix,
				},
			});
		}
	};

	// 欧拉角旋转
	rotate = (ax, ay, az) => {
		this._rotate(ax, ay, az);
		if (this.stage) {
			const camera = this.stage.camera;
			const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
			mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
			this._updateProps({
				uniforms: {
					mvpMatrix,
				},
			});
		}
	};

	// 四元数旋转
	rotateByQuat(x, y, z, angle) {
		this._rotateByQuat(x, y, z, angle);
		if (this.stage) {
			const camera = this.stage.camera;
			const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
			mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
			this._updateProps({
				uniforms: {
					mvpMatrix,
				},
			});
		}
	}

	// 缩放
	scale = (sx, sy, sz) => {
		this._scale(sx, sy, sz);
		if (this.stage) {
			const camera = this.stage.camera;
			const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
			mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
			this._updateProps({
				uniforms: {
					mvpMatrix,
				},
			});
		}
	};

	// 保存状态
	save = () => {
		this._save();
	};

	// 恢复状态
	restore = () => {
		this._restore();
		if (this.stage) {
			const camera = this.stage.camera;
			const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
			mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
			this._updateProps({
				uniforms: {
					mvpMatrix,
				},
			});
		}
	};

	// 更新属性
	_updateProps(props) {
		this.geometry = props?.geometry && props?.geometry instanceof Geometry ? props.geometry : new Geometry();
		this.material = props?.material && props?.material instanceof Material ? props.material : new Material();
		this.attributes = {
			positions: this.geometry.positions,
			colors: this.geometry.colors,
			normals: this.geometry.normals,
			indices: this.geometry.indices,
			...this.material.attributes, // 其他在材质中定义的atrribute变量
		};
		this.uniforms = {
			...this.material.uniforms, // 其他在材质中定义的uniforms变量
		};
		// 由stage触发更新
		if (this.stage) {
			this.stage._update([{ id: this.id, props }]);
		}
	}

	// 添加至stage
	_addToStage(stage) {
		if (this.stage || stage.primitiveList[this.id]) {
			return;
		}
		stage.primitiveList[this.id] = this;
		this.stage = stage;
		// 将变换矩阵添加至uniforms变量
		const camera = this.stage.camera;
		const mvpMatrix = mat4.multiply(mat4.create(), camera.state.viewMatrix, this.state.modelMatrix);
		mat4.multiply(mvpMatrix, camera.state.projectionMatrix, mvpMatrix);
		this.uniforms = {
			...this.uniforms,
			mvpMatrix,
			viewportMatrix: this.stage.state.viewportMatrix,
		};
		return this;
	}

	// 从stage删除
	_removeFromStage(stage) {
		if (stage.primitiveList[this.id]) {
			delete stage.primitiveList[this.id];
			this.stage = null;
			return true;
		}
		return false;
	}
}
