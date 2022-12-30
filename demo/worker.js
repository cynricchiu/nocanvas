// 与主线程交互事件列表
this.eventList = {
	init: {
		fn: canvas => {
			this._init(canvas);
		},
	},
	drawPoints: {
		fn: points => {
			this.drawPoints(points);
		},
	},
	loadWasm: {
		fn: () => {
			// 加载wasm文件
			// this.loadWebAssembly('../src/renderer/wasm/hello-emcc.wasm').then(instance => {
			// 	//调用c里面的方法
			// 	const add = instance.exports.add;

			// 	console.log('10 + 20 =', add(10, 20));
			// });
			this.loadWebAssembly('../src/renderer/wasm/hello-emcc.wasm');
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
	this.lastTime = 0; // 统计帧率
	this.fps = 0;
	this.points = { positions: [], colors: [], pointSize: 1 };
	requestAnimationFrame(this._render);
};

// 帧循环
_render = () => {
	requestAnimationFrame(this._render);
	this.gl.clearRect(0, 0, this.width, this.height);
	this.gl.drawImage(this.bfc, 0, 0);
	// 计算fps
	this.fps = Math.round(1000 / (Date.now() - this._lastTime));
	this.postMessage({ fps: this.fps });
	this._lastTime = Date.now();
};

// 设置像素
_setPixel = (x, y, color) => {
	if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
		// 需要限制x∈[0,w],y∈[0,h],否则会溢出
		x = x >> 0; // 列
		y = y >> 0; // 行
		const r = color[0] >> 0;
		const g = color[1] >> 0;
		const b = color[2] >> 0;
		const a = color[3] >> 0;
		const index = y * this.width + x;
		this.bImageData.data[index * 4] = r;
		this.bImageData.data[index * 4 + 1] = g;
		this.bImageData.data[index * 4 + 2] = b;
		this.bImageData.data[index * 4 + 3] = a;
	}
};

// 绘制点集
drawPoints = points => {
	this.bImageData.data.fill(0); // 每次清空画布后再getImageData方法非常消耗性能，所以用清空数组的方法替换，很有效
	const { positions, colors, pointSize } = points;
	for (let i = 0; i < positions.length; i += 2) {
		const x = positions[i * 2];
		const y = positions[i * 2 + 1];
		const r = colors[i * 4];
		const g = colors[i * 4 + 1];
		const b = colors[i * 4 + 2];
		const a = colors[i * 4 + 3];
		// 点的大小可调，点关于中心对称
		for (let j = 0; j < pointSize; j++) {
			for (let k = 0; k < pointSize; k++) {
				this._setPixel(x + j - pointSize / 2, y + k - pointSize / 2, [r, g, b, a]);
			}
		}
	}
	this.bgl.putImageData(this.bImageData, 0, 0);
};

//加载wasm
// loadWebAssembly = (path, imports = {}) => {
// 	return fetch(path) // 加载文件
// 		.then(response => response.arrayBuffer()) // 转成 ArrayBuffer
// 		.then(buffer => WebAssembly.compile(buffer))
// 		.then(module => {
// 			imports.env = imports.env || {};

// 			// 开辟内存空间
// 			imports.env.memoryBase = imports.env.memoryBase || 0;
// 			if (!imports.env.memory) {
// 				imports.env.memory = new WebAssembly.Memory({ initial: 1, maximum: 10 });
// 			}

// 			// 创建变量映射表
// 			imports.env.tableBase = imports.env.tableBase || 0;
// 			if (!imports.env.table) {
// 				// 在 MVP 版本中 element 只能是 "anyfunc"
// 				imports.env.table = new WebAssembly.Table({ initial: 0, element: 'anyfunc' });
// 			}

// 			// 创建 WebAssembly 实例
// 			return new WebAssembly.Instance(module, imports);
// 		});
// };
loadWebAssembly = path => {
	fetch(path)
		.then(response => {
			return response.arrayBuffer();
		})
		.then(bytes => {
			const importObject = {
				imports: {
					imported_func(arg) {
						console.log(arg);
					},
				},
			};
			return WebAssembly.instantiate(bytes, importObject);
		})
		.then(result => {
			console.log(result);
		});
};
