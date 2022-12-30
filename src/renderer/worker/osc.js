/**
 * 离屏canvas操作
 */

importScripts('./shader.js');

// 与主线程交互事件列表
this.eventList = {
	init: {
		fn: canvas => {
			this._init(canvas);
		},
	},
	add: {
		fn: addList => {
			this._add(addList);
		},
	},
	remove: {
		fn: removeIds => {
			this._remove(removeIds);
		},
	},
	updateProps: {
		fn: updateList => {
			this._updateProps(updateList);
		},
	},
};

this.onmessage = e => {
	const { name, args } = e.data;
	const event = eventList[name];
	if (event) {
		event.fn.call(this, ...args);
		this.postMessage(`${name} fired`);
	}
};

this.onerror = e => {
	console.log(`ERROR: Line ${e.lineno} in ${e.filename} : ${e.message}`);
};

/**
 * 渲染相关
 */

// 初始化
_init = canvas => {
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	this.gl = this.canvas.getContext('2d');
	// 双缓冲
	this.bfc = new OffscreenCanvas(this.width, this.height);
	this.bgl = this.bfc.getContext('2d');
	this.bImageData = this.bgl.getImageData(0, 0, this.width, this.height); // 作为帧缓存
	this._shaderList = {}; // shader列表
	this.lastTime = 0; // 开启帧循环
	// 渲染统计信息
	this.renderInfo = {
		drawCalls: 0, // drawCall数
		vert: 0, // 顶点数
		tri: 0, // 三角形数
		fps: 0, // 帧率
	};
	requestAnimationFrame(this._render);
};

// 帧循环
_render = () => {
	requestAnimationFrame(this._render);
	this.gl.clearRect(0, 0, this.width, this.height);
	// this.bgl.clearRect(0, 0, this.width, this.height);
	this.bImageData.data.fill(0); // 每次清空画布后再getImageData方法非常消耗性能，所以用清空数组的方法替换，很有效
	this._drawArrays(this._shaderList);
	this.gl.drawImage(this.bfc, 0, 0);
	// 计算fps
	this.renderInfo.fps = Math.round(1000 / (Date.now() - this.lastTime));
	this.postMessage({ renderInfo: this.renderInfo });
	this.lastTime = Date.now();
};

// draw call
_drawArrays = shaderList => {
	const info = { drawCalls: 0, vert: 0, tri: 0 }; // 渲染统计信息
	for (let id in shaderList) {
		const shader = shaderList[id];
		this.bImageData.data.set(shader.colorBuffer);
		// this.postMessage(shader.EBO);
		// 	switch (shader.type) {
		// 		case 'GL_POINTS': {
		// 			this._drawPoints(shader);
		// 			info.drawCalls += 1;
		// 			info.vert += 1;
		// 			break;
		// 		}
		// 		case 'GL_LINE_STRIP': {
		// 			break;
		// 		}
		// 		case 'GL_TRIANGLES': {
		// 			const triangles = shader.primitives;
		// 			for (let i = 0; i < triangles.length; i++) {
		// 				this._drawTriangle(shader, triangles[i]);
		// 				info.drawCalls += 1;
		// 				info.tri += 1;
		// 				info.vert += 3;
		// 			}
		// 			break;
		// 		}
		// 		default: {
		// 			break;
		// 		}
		// 	}
	}
	this.renderInfo = { ...this.renderInfo, ...info };
	this.bgl.putImageData(this.bImageData, 0, 0);
};

// 批量添加
_add = addList => {
	for (let i = 0; i < addList.length; i++) {
		const { id, type, attributes, uniforms, vert, frag } = addList[i];
		// 每个物体分配一个shader
		const shader = new Shader({
			width: this.width,
			height: this.height,
			type,
			attributes,
			uniforms,
			vert,
			frag,
		});
		if (!this._shaderList[id]) {
			this._shaderList[id] = shader;
		}
		shader.execute();
	}
};

// 批量删除
_remove = removeIds => {
	for (let i = 0; i < removeIds.length; i++) {
		const id = removeIds[i];
		const shader = this._shaderList[id];
		if (shader) {
			shader.destroy();
		}
		delete this._shaderList[id];
	}
};

// 批量更新
_updateProps = updateList => {
	for (let i = 0; i < updateList.length; i++) {
		const { id, props } = updateList[i];
		const shader = this._shaderList[id];
		if (shader) {
			shader.updateProps(props);
		}
	}
};
