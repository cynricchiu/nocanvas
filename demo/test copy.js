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

// 原始数据
const num = 1000000; // 数据量
const positions = new Float32Array(num * 4);
const result = new Float32Array(num * 4);
for (let i = 0; i < num; i++) {
	const x = Math.random() * 1000;
	const y = Math.random() * 1000;
	const z = Math.random() * 1000;
	const w = 1;
	positions[i * 4] = x;
	positions[i * 4 + 1] = y;
	positions[i * 4 + 2] = z;
	positions[i * 4 + 3] = w;
}
const workerList = [];

const watchTime = count => {
	performance.mark('start');

	let restLength = num; // 待完成总量
	let completeLength = 0; // 已完成总量
	let offset = 0; // 当前数据偏移量
	let index = 0;
	while (restLength > 0) {
		// 数据分片
		const blockLength = Math.min(Math.floor(num / count), restLength);
		const blockData = positions.slice(offset * 4, offset * 4 + blockLength * 4);
		// 多线程
		const worker = new Worker('./worker.js');
		worker.postMessage({ index, offset, length: blockLength, data: blockData.buffer }, [blockData.buffer]);
		worker.onmessage = msg => {
			const { index, offset: completeOffset, data: completeData, length } = msg.data;
			console.log(`第 ${index} 个数据分片已完成`);
			// 拼接执行结果
			result.set(new Float32Array(completeData), completeOffset * 4);
			completeLength += length;
			if (completeLength === num) {
				performance.mark('end');
				const measure = performance.measure('time', 'start', 'end');
				console.log(`执行时间${measure.duration}`);
				// console.log(`执行结果${result}`);
				performance.clearMarks('time');
				workerList.forEach(worker => {
					worker.terminate();
				});
			}
		};
		workerList.push(worker);

		// 数据量偏移
		offset += blockLength;
		restLength -= blockLength;
		index += 1;
	}
};

// const test = () => {
// 	for (let i = 0; i < num; i++) {
// 		const u_mvpMatrix = mat4.fromValues(1, 2, 3, 4);
// 		const a_position = vec4.fromValues(1, 3, 4, 5);
// 		const gl_Position = vec4.transformMat4(vec4.create(), a_position, u_mvpMatrix);
// 		// const a = [1, 2, 3, 4];
// 		// buffer.set(a);
// 		// const buffer = new Float32Array(a);
// 	}
// };

watchTime(4);

performance.mark('s');
// const buffer = new ArrayBuffer(1024 * 1024 * 10);
// const view = new Uint8Array(buffer);
// let numPrimes = 0;
// for (let i = 0; i < view.length; i++) {
// 	const primeCandidate = i + 2;
// 	const result = isPrime(primeCandidate);
// 	if (result) {
// 		numPrimes += 1;
// 	}
// 	view[i] = result;
// }

for (let i = 0; i < positions.length; i += 4) {
	const position = vec4.fromValues(
		positions[i * 4],
		positions[i * 4 + 1],
		positions[i * 4 + 2],
		positions[i * 4 + 3]
	);
	transform(position);
}

performance.mark('e');

console.log(performance.measure('time2', 's', 'e').duration);

function fibonacci(n) {
	if (n < 2) {
		return n;
	} else {
		return fibonacci(n - 1) + fibonacci(n - 2);
	}
}
function isPrime(n) {
	for (let i = 2; i < Math.floor(Math.sqrt(n)); i++) {
		if (n % i === 0) return false;
	}
	return true;
}
function transform(position) {
	const matrix = mat4.fromValues(1, 2, 3, 4);
	vec4.transformMat4(position, position, matrix);
}
