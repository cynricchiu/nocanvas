import { Dom } from '../src/util/util';

class Renderer {
	constructor(canvas) {
		this._init(canvas);
	}

	// 初始化
	_init = canvas => {
		const retina = window.devicePixelRatio > 1 ? 2 : 1;
		this.width = canvas.offsetWidth * retina;
		this.height = canvas.offsetHeight * retina;
		canvas.width = this.width;
		canvas.height = this.height;
		this.canvas = canvas;

		// 渲染进程在worker中工作
		this.osc = this.canvas.transferControlToOffscreen();
		if (!this.oscWorker) {
			this.oscWorker = new Worker('./worker.js');
		}
		this.oscWorker.postMessage({ name: 'init', args: [this.osc] }, [this.osc]);
		this.oscWorker.onmessage = e => {
			if (e.data.fps) {
				// 显示渲染统计信息
				this.showRenderInfo(e.data.fps);
			} else {
				console.log(e.data);
			}
		};
	};

	drawPoints = points => {
		this.oscWorker.postMessage({ name: 'drawPoints', args: [points] });
	};

	// 添加fps显示
	showRenderInfo = fps => {
		if (!this.infoEl) {
			this.infoEl = document.createElement('div');
			document.body.appendChild(this.infoEl);
			Dom.setCSSStyle(this.infoEl, {
				position: 'absolute',
				top: `${this.canvas.offsetTop + 10}px`,
				left: `${this.canvas.offsetLeft + 10}px`,
				zIndex: 999,
				color: '#ffffff',
				background: '#000000',
				fontSize: '14px',
				padding: 0,
			});
		}
		this.infoEl.innerHTML = `FPS: ${fps} `;
		Dom.setCSSStyle(this.infoEl, {
			background: fps < 40 ? '#ff0000' : '#000000',
		});
	};
}

const canvas = document.getElementById('container');
const renderer = new Renderer(canvas);

// 点集数据
const num = 1000;
const points = {
	positions: new Float32Array(num * 2),
	colors: new Float32Array(num * 4),
	pointSize: 10,
};

for (let i = 0; i < num; i++) {
	const x = random(0, renderer.width);
	const y = random(0, renderer.height);
	const r = random(0, 255);
	const g = random(0, 255);
	const b = random(0, 255);
	const a = 255;
	points.positions[i * 2] = x;
	points.positions[i * 2 + 1] = y;
	points.colors[i * 4] = r;
	points.colors[i * 4 + 1] = g;
	points.colors[i * 4 + 2] = b;
	points.colors[i * 4 + 3] = a;
}

console.log(points);

renderer.drawPoints(points);

function random(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

const vec4 = {
	create: function () {
		let out = new Array(4);
		return out;
	},

	fromValues: function fromValues(x, y, z, w) {
		let out = new Array(4);
		out[0] = x;
		out[1] = y;
		out[2] = z;
		out[3] = w;
		return out;
	},

	transformMat4: function (out, a, m) {
		let x = a[0],
			y = a[1],
			z = a[2],
			w = a[3];
		out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
		out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
		out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
		out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
		return out;
	},
};

const mat4 = {
	fromValues: function (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
		let out = new Array(16);
		out[0] = m00;
		out[1] = m01;
		out[2] = m02;
		out[3] = m03;
		out[4] = m10;
		out[5] = m11;
		out[6] = m12;
		out[7] = m13;
		out[8] = m20;
		out[9] = m21;
		out[10] = m22;
		out[11] = m23;
		out[12] = m30;
		out[13] = m31;
		out[14] = m32;
		out[15] = m33;
		return out;
	},
};
// 性能测试

// // 原始数据
// const num = 1000; // 数据量
// const positions = new Float32Array(num * 4);
// const result = new Float32Array(positions.buffer); // 返回结果
// for (let i = 0; i < num; i++) {
// 	const x = i;
// 	const y = i;
// 	const z = i;
// 	const w = 1;
// 	positions[i * 4] = x;
// 	positions[i * 4 + 1] = y;
// 	positions[i * 4 + 2] = z;
// 	positions[i * 4 + 3] = w;
// }
// const fn = position => {
// 	const a_position = vec4.fromValues(...position);
// 	const matrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
// 	const gl_Position = vec4.transformMat4(vec4.create(), a_position, matrix);
// 	return gl_Position;
// };

// const test = positions => {
// 	performance.mark('start');
// 	for (let i = 0; i < positions.length; i += 4) {
// 		const element = [];
// 		const stride = 4;
// 		for (let j = 0; j < stride; j++) {
// 			element.push(positions[i * stride + j]);
// 		}
// 		const gl_Position = fn.call(null, element);
// 		for (let j = 0; j < stride; j++) {
// 			result[i * stride + j] = gl_Position[j];
// 		}
// 	}
// 	performance.mark('end');
// 	const measure = performance.measure('main', 'start', 'end');
// 	console.log(`执行时间: ${measure.duration}`);
// 	// console.log(`执行结果: ${result}`);
// };

// // test(positions);
// // 1200

// class Parallel {
// 	constructor(data, options) {
// 		this.data = data; // TypedArray
// 		this.dataType = options?.dataType || 'Float32Array'; // array type
// 		this.stride = options?.stride || 1; // 取数间隔
// 		this.workerNum = options?.workerNum || 1; // worker数
// 		this.dataNum = data.length / this.stride; // 数据量
// 	}

// 	// 遍历数据执行运算
// 	map = fn => {
// 		let restLength = this.dataNum; // 待完成数据量
// 		let completeLength = 0; // 已完成数据量
// 		let offset = 0; // 当前数据偏移量
// 		this.workerList = [];
// 		performance.mark('start');
// 		for (let i = 0; i < this.workerNum; i++) {
// 			// 数据分片
// 			const blockLength = i === this.workerNum - 1 ? restLength : Math.floor(this.dataNum / this.workerNum);
// 			const blockData = this.data.slice(offset * this.stride, (offset + blockLength) * this.stride);
// 			// 多线程
// 			const worker = new Worker('./worker.js', { name: `worker-${i}` });
// 			worker.postMessage(
// 				{
// 					fnString: fn.toString(),
// 					offset,
// 					stride: this.stride,
// 					length: blockLength,
// 					buffer: blockData.buffer,
// 					dataType: this.dataType,
// 				},
// 				[blockData.buffer]
// 			);
// 			worker.onmessage = msg => {
// 				const { name, length, buffer } = msg.data;
// 				console.log(`${name} 的数据分片已完成`);
// 				// 拼接执行结果
// 				result.set(new Float32Array(buffer), offset);
// 				completeLength += length;
// 				if (completeLength === this.dataNum) {
// 					performance.mark('end');
// 					const measure = performance.measure('time', 'start', 'end');
// 					console.log(`执行时间${measure.duration}`);
// 					console.log(`执行结果${result}`);
// 					performance.clearMarks('time');
// 					this.workerList.forEach(worker => {
// 						worker.terminate();
// 					});
// 				}
// 			};
// 			this.workerList.push(worker);
// 			// 数据量偏移
// 			offset += blockLength;
// 			restLength -= blockLength;
// 		}
// 	};
// }

// // const parallel = new Parallel(positions, {
// // 	dataType: 'Float32Array',
// // 	stride: 4,
// // 	workerNum: 4,
// // });
// // parallel.map(fn, []);

// // const watchTime = count => {
// // 	performance.mark('start');

// // 	let restLength = num; // 待完成总量
// // 	let completeLength = 0; // 已完成总量
// // 	let offset = 0; // 当前数据偏移量
// // 	let index = 0;
// // 	const result = [];
// // 	while (restLength > 0) {
// // 		// 数据分片
// // 		const blockLength = Math.min(Math.floor(num / count), restLength);
// // 		// 多线程
// // 		const worker = new Worker('./worker.js');
// // 		worker.postMessage({ index, offset, length: blockLength });
// // 		worker.onmessage = msg => {
// // 			const { index, offset: completeOffset, length, result: completeResult } = msg.data;
// // 			console.log(`第 ${index} 个数据分片已完成`);
// // 			// 拼接执行结果
// // 			result.push(...completeResult);
// // 			completeLength += length;
// // 			if (completeLength === num) {
// // 				performance.mark('end');
// // 				const measure = performance.measure('time', 'start', 'end');
// // 				console.log(`执行时间${measure.duration}`);
// // 				console.log(`执行结果${result.length}`);
// // 				performance.clearMarks('time');
// // 				workerList.forEach(worker => {
// // 					worker.terminate();
// // 				});
// // 			}
// // 		};
// // 		workerList.push(worker);

// // 		// 数据量偏移
// // 		offset += blockLength;
// // 		restLength -= blockLength;
// // 		index += 1;
// // 	}
// // };

// // watchTime(4);
// // console.log(workerList);
// // const buffer = new ArrayBuffer(1024 * 1024 * 10);
// // const view = new Uint8Array(buffer);
// // performance.mark('s');
// // let numPrimes = 0;
// // for (let i = 0; i < view.length; i++) {
// // 	const primeCandidate = i + 2;
// // 	const result = isPrime(primeCandidate);
// // 	if (result) {
// // 		numPrimes += 1;
// // 	}
// // 	view[i] = result;
// // }
// // performance.mark('e');

// // console.log(performance.measure('time2', 's', 'e').duration);
// // console.log(result);

// // function isPrime(n) {
// // 	for (let i = 2; i < Math.floor(Math.sqrt(n)); i++) {
// // 		if (n % i === 0) return false;
// // 	}
// // 	return true;
// // }
// // function fibonacci(n) {
// // 	if (n < 2) {
// // 		return n;
// // 	} else {
// // 		return fibonacci(n - 1) + fibonacci(n - 2);
// // 	}
// // }

// // function f1(a, b) {
// // 	return a + b;
// // }

// // function f2(a, b) {
// // 	return f1(a, b);
// // }

// // const fnString = f2.toString();
// // const fnRebuild = new Function(`return ${fnString}`)();
// // console.log('123123', fnString, fnRebuild.call(this, 1, 2));
