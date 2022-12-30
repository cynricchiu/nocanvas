importScripts('./gl-matrix-min.js', './clip.js');

// GL_POINTS
const rasterPoint = (points, colorBuffer, width, height) => {
	for (let i = 0; i < points.length; i++) {
		const vertex = points[i];
		const { screenPosition, gl_PointSize, varyings } = vertex;
		const [x, y] = screenPosition;
		const color = varyings['v_color'];
		// 点的大小可调，点关于中心对称
		for (let j = 0; j < gl_PointSize; j++) {
			for (let k = 0; k < gl_PointSize; k++) {
				_setPixel(colorBuffer, x + j - gl_PointSize / 2, y + k - gl_PointSize / 2, color, width, height);
			}
		}
	}
};

// GL_LINES
const rasterLines = (lines, colorBuffer, width, height) => {
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const [v1, v2] = line;
		const [x1, y1] = v1.screenPosition;
		const [x2, y2] = v2.screenPosition;
		const color1 = v1.varyings['v_color'];
		const color2 = v2.varyings['v_color'];
		// Bresenham直线算法
		let dx = Math.abs(x2 - x1);
		let dy = Math.abs(y2 - y1);
		const sx = x1 < x2 ? 1 : -1;
		const sy = y1 < y2 ? 1 : -1;
		let err = dx - dy,
			e2;
		let x = x1;
		let y = y1;
		for (;;) {
			// 颜色插值
			const t = x1 !== x2 ? (x - x1) / (x2 - x1) : (y - y1) / (y2 - y1);
			const color = vec4.lerp(vec4.create(), color1, color2, t);
			_setPixel(colorBuffer, x, y, color, width, height);
			if (x === x2 && y === y2) break;
			e2 = 2 * err;
			if (e2 >= -dy) {
				err += -dy;
				x += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y += sy;
			}
		}
	}
};

// GL_TRIANGLES
const rasterTriangles = (triangles, colorBuffer, width, height) => {
	for (let i = 0; i < triangles.length; i++) {
		const triangle = triangles[i];
		const [v1, v2, v3] = triangle;
		const [x1, y1] = v1.screenPosition;
		const [x2, y2] = v2.screenPosition;
		const [x3, y3] = v3.screenPosition;
		const [r1, g1, b1, a1] = v1.varyings['v_color'];
		const [r2, g2, b2, a2] = v2.varyings['v_color'];
		const [r3, g3, b3, a3] = v3.varyings['v_color'];
		// 三角形包围盒
		const xmin = Math.min(x1, x2, x3);
		const xmax = Math.max(x1, x2, x3);
		const ymin = Math.min(y1, y2, y3);
		const ymax = Math.max(y1, y2, y3);
		// 三角形三条边
		const line1 = getLine([x1, y1], [x2, y2]);
		const line2 = getLine([x2, y2], [x3, y3]);
		const line3 = getLine([x3, y3], [x1, y1]);
		for (let x = xmin; x < xmax; x++) {
			for (let y = ymin; y < ymax; y++) {
				// 找出在三角形内部的像素
				if (isInBound([x, y], [line1, line2, line3])) {
					// 颜色插值
					const { alpha, beta, lamda } = barycentric(
						x,
						y,
						v1.screenPosition,
						v2.screenPosition,
						v3.screenPosition
					);
					const r = r1 * alpha + r2 * beta + r3 * lamda;
					const g = g1 * alpha + g2 * beta + g3 * lamda;
					const b = b1 * alpha + b2 * beta + b3 * lamda;
					const a = a1 * alpha + a2 * beta + a3 * lamda;
					_setPixel(colorBuffer, x, y, [r, g, b, a], width, height);
				}
			}
		}
	}
};

// 设置像素颜色
const _setPixel = (colorBuffer, x, y, color, width, height) => {
	if (x >= 0 && x <= width && y >= 0 && y <= height) {
		// 需要限制x∈[0,w],y∈[0,h],否则会溢出
		x = x >> 0; // 列
		y = y >> 0; // 行
		const r = color[0] >> 0;
		const g = color[1] >> 0;
		const b = color[2] >> 0;
		const a = color[3] >> 0;
		const index = y * width + x;
		colorBuffer[index * 4] = r;
		colorBuffer[index * 4 + 1] = g;
		colorBuffer[index * 4 + 2] = b;
		colorBuffer[index * 4 + 3] = a;
	}
};

// 重心插值
const barycentric = (x, y, v1, v2, v3) => {
	const [x1, y1] = v1;
	const [x2, y2] = v2;
	const [x3, y3] = v3;
	const alpha = (-(x - x2) * (y3 - y2) + (y - y2) * (x3 - x2)) / (-(x1 - x2) * (y3 - y2) + (y1 - y2) * (x3 - x2));
	const beta = (-(x - x3) * (y1 - y3) + (y - y3) * (x1 - x3)) / (-(x2 - x3) * (y1 - y3) + (y2 - y3) * (x1 - x3));
	const lamda = 1 - alpha - beta;
	return { alpha, beta, lamda };
};
