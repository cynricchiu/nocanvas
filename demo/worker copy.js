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

this.onmessage = msg => {
	const { index, offset, length, data } = msg.data;
	const rawData = new Float32Array(data);
	// 重复操作
	for (let i = 0; i < rawData.length; i += 4) {
		const position = vec4.fromValues(rawData[i * 4], rawData[i * 4 + 1], rawData[i * 4 + 2], rawData[i * 4 + 3]);
		transform(position);
	}
	this.postMessage({ index, length, offset, data: rawData.buffer }, [rawData.buffer]);
};

function fibonacci(n) {
	if (n < 2) {
		return n;
	} else {
		return fibonacci(n - 1) + fibonacci(n - 2);
	}
}

function transform(position) {
	const matrix = mat4.fromValues(1, 2, 3, 4);
	vec4.transformMat4(position, position, matrix);
}
