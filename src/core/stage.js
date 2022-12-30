import { mat4, vec3 } from '../util/gl-matrix-min';
import { Camera, PerspectiveCamera } from './camera';
import { CanvasRenderer } from '../renderer/renderer';
import { Primitive } from './primitive';
import { Browser, Dom, getUUID, throttle, requestAnimationFrame, cancelAnimationFrame } from '../util/util';
import { arcball } from '../util/math';

/**
 * 场景
 */
export class Stage {
	constructor(canvas) {
		if ((this.canvas = canvas)) {
			this.id = `${getUUID(6, 16)}`;
			this._initRenderer();
			this._initStage();
			this._initEvents();
		}
	}

	// 初始化渲染器
	_initRenderer() {
		const retina = Browser.getRetina();
		this.canvas.width = Math.floor(this.canvas.offsetWidth * retina);
		this.canvas.height = Math.floor(this.canvas.offsetHeight * retina);
		this.renderer = new CanvasRenderer(this.canvas);
	}

	// 初始化舞台
	_initStage() {
		this.primitiveList = {}; // primitive存储列表
		this.state = {
			viewportMatrix: mat4.identity(new Float32Array(16)), // 视口变换：归一化设备坐标系-屏幕坐标系
		};
		this.camera = new PerspectiveCamera();
		this._updateCamera();
		this._updateViewport();
	}

	// 舞台交互事件
	_initEvents() {
		Dom.on(this.canvas, 'mousedown', this._onMousePan, this);
		Dom.on(this.canvas, 'scroll', this._onMouseZoom, this);
		// Util.Dom.on(this.canvas, 'resize', this._onResize, this.canvas);
	}

	// 设置相机
	setCamera = camera => {
		camera = camera instanceof Camera ? camera : new PerspectiveCamera();
		if (camera._addToStage(this)) {
			this._updateCamera();
		}
	};

	// 批量添加物体
	add = primitives => {
		const addList = []; // 待添加列表
		primitives.map(p => {
			if (p instanceof Primitive && p._addToStage(this)) {
				addList.push({
					id: p.id,
					type: p.type, // 图元类型
					// attribute变量名称以及取值对象
					attributes: p.attributes,
					// uniform变量名称以及取值
					uniforms: p.uniforms,
					// 顶点着色器
					vert: p.material.vert.toString(), //函数无法传入worker，所以转字符串
					// 片元着色器
					frag: p.material.frag.toString(),
				});
			}
		});
		if (addList.length) {
			this.renderer.add(addList);
		}
	};

	// 批量删除物体
	remove = primitives => {
		const removeIds = [];
		primitives.map(p => {
			if (p instanceof Primitive && p._removeFromStage(this)) {
				removeIds.push(p.id);
			}
		});
		if (removeIds.length) {
			this.renderer.remove(removeIds);
		}
	};

	// 清空所有物体
	clear = () => {
		const primitives = Object.values(this.primitiveList);
		this.remove(primitives);
	};

	// 批量更新物体
	_update = updateList => {
		if (updateList.length) {
			this.renderer.update(updateList);
		}
	};

	// 更新所有物体
	updateAll = props => {
		// 只限更新uniforms变量
		const updateList = [];
		for (let id in this.primitiveList) {
			const primitive = this.primitiveList[id];
			updateList.push({ id: primitive.id, props: { uniforms: props.uniforms } });
		}
		this._update(updateList);
	};

	// 用相机观察某个物体(绕y轴旋转)
	observe = id => {
		const primitive = this.primitiveList[id];
		if (primitive && !this.observeRafId) {
			this.camera.save(); // 保存初始相机状态
			this.camera.lookAt({ center: primitive.state.translation });
			const stepAngle = 0.2; // 每次旋转角度
			const rotateY = () => {
				this.observeRafId = requestAnimationFrame(rotateY);
				// 眼向量绕物体中心旋转
				this.camera.rotate(0, stepAngle, 0);
				this._updateCamera();
			};
			requestAnimationFrame(rotateY);
		}
	};

	// 停止观察
	stopObserve = () => {
		if (this.observeRafId) {
			cancelAnimationFrame(this.observeRafId);
			this.observeRafId = null;
			this.camera.restore(); // 恢复相机初始状态
			this.camera.update();
			this._updateCamera();
		}
	};

	// 更新视口变换矩阵
	_updateViewport() {
		const { viewportMatrix } = this.state;
		const w = this.canvas.width;
		const h = this.canvas.height;
		const n = this.camera.state.near;
		const f = this.camera.state.far;
		// canvas坐标系y轴向下
		viewportMatrix[0] = w / 2;
		viewportMatrix[5] = -h / 2;
		viewportMatrix[12] = w / 2;
		viewportMatrix[13] = h / 2;
		// z不变换，z∈[-1,1]
		this.state.viewportMatrix = viewportMatrix;
		// // 更新所有物体
		// this.updateAll({
		// 	uniforms: {
		// 		viewportMatrix: this.state.viewportMatrix,
		// 	},
		// });

		// 更新所有物体
		const updateList = [];
		for (let id in this.primitiveList) {
			const primitive = this.primitiveList[id];
			updateList.push({
				id: primitive.id,
				props: {
					uniforms: {
						viewportMatrix: this.state.viewportMatrix,
					},
				},
			});
		}
		this._update(updateList);
	}

	// 更新相机矩阵
	_updateCamera() {
		const viewMatrix = this.camera.state.viewMatrix; // 视图变换
		const projectionMatrix = this.camera.state.projectionMatrix; // 投影变换
		// projection * view
		const vpMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
		// 更新所有物体
		const updateList = [];
		for (let id in this.primitiveList) {
			const primitive = this.primitiveList[id];
			// projection * view * model
			const mvpMatrix = mat4.multiply(mat4.create(), vpMatrix, primitive.state.modelMatrix);
			updateList.push({
				id: primitive.id,
				props: {
					uniforms: {
						mvpMatrix,
					},
				},
			});
		}
		this._update(updateList);
	}

	// resize事件：渲染器大小自适应
	_onResize() {
		throttle(canvas => {
			const retina = Browser.getRetina();
			const width = Math.floor(canvas.offsetWidth * retina);
			const height = Math.floor(canvas.offsetHeight * retina);
			// this.oscWorker.postMessage({
			// 	name: 'resize',
			// 	args: [width, height],
			// });
		});
	}

	// 鼠标左键拖动事件：物体旋转
	_onMousePan = throttle(e => {
		this._isPanning = true;
		// arcball算法计算三维旋转向量
		const vec1 = arcball(e.clientX, e.clientY, this.canvas.offsetWidth, this.canvas.offsetHeight);
		document.onmousemove = throttle(e => {
			if (this._isPanning && e.buttons === 1) {
				//在容器范围内
				const left = this.canvas.offsetLeft;
				const top = this.canvas.offsetTop;
				const right = this.canvas.offsetLeft + this.canvas.offsetWidth;
				const bottom = this.canvas.offsetTop + this.canvas.offsetHeight;
				if (e.clientX > left && e.clientX < right && e.clientY > top && e.clientY < bottom) {
					// arcball算法计算三维旋转向量
					const vec2 = arcball(e.clientX, e.clientY, this.canvas.offsetWidth, this.canvas.offsetHeight);
					let angle = (Math.acos(vec3.dot(vec1, vec2)) * 180) / Math.PI; // 计算旋转角
					angle = angle / 3; // 调整转速
					const axis = vec3.cross(vec3.create(), vec1, vec2); // 计算旋转轴：即两向量所在平面的法向量
					const axisNormal = vec3.normalize(vec3.create(), axis);
					// 物体旋转
					for (let id in this.primitiveList) {
						const primitive = this.primitiveList[id];
						primitive.rotateByQuat(axisNormal[0], axisNormal[1], axisNormal[2], angle);
					}
				}
			}
		});
		document.onmouseup = e => {
			this._isPanning = false;
			document.onmousemove = document.onmouseup = null;
		};
	}, this);

	// 鼠标中键事件：缩放
	_onMouseZoom(e) {
		const isDown = e.wheelDelta ? e.wheelDelta < 0 : e.detail > 0; // 鼠标滚轮上下方向
		// 向上放大，向下缩小
		const stepZoom = isDown ? 1 : -1;
		this.camera.zoom(stepZoom);
		this._updateCamera();
	}
}
