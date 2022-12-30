// 图元裁剪(在裁剪空间内)

// 两点坐标求直线一般式方程
function getLine(pt1, pt2) {
	const [x1, y1] = pt1;
	const [x2, y2] = pt2;
	const A = y2 - y1;
	const B = x1 - x2;
	const C = x2 * y1 - x1 * y2;
	return { A, B, C };
}

// 点是否在直线内部
function isInnerOfLine(pt, line) {
	const [x, y] = pt;
	const { A, B, C } = line;
	return A * x + B * y + C >= 0;
}

// 点是否在多条边界线内部
function isInBound(pt, lines) {
	for (let i = 0; i < lines.length; i++) {
		if (!isInnerOfLine(pt, lines[i])) {
			return false;
		}
	}
	return true;
}

// 点裁剪
function clipPoint(pt, lines) {
	const result = [];
	if (isInBound(pt, lines)) {
		result.push(pt);
	}
	return result;
}

// 点集裁剪
function clipPoints(pts, lines) {
	const result = [];
	for (let i = 0; i < pts.length; i++) {
		const pt = pts[i];
		result.push(...clipPoint(pt, lines));
	}
	return result;
}

// 线段裁剪
function clipLineseg(lineseg, lines) {
	const result = [];
	const [p1, p2] = lineseg;
	const [x1, y1] = p1;
	const [x2, y2] = p2;
	// 判断p1p2向量与各边界直线的位置关系
	const t_in = []; // 入边t值
	const t_out = []; // 出边t值
	for (let i = 0; i < lines.length; i++) {
		const { A, B, C } = lines[i];
		const dot = (x2 - x1) * A + (y2 - y1) * B;
		if (dot !== 0) {
			// 求交点的参数值t
			const t = -(A * x1 + B * y1 + C) / (A * x2 - A * x1 + B * y2 - B * y1);
			if (dot > 0) {
				t_in.push(t);
			} else {
				t_out.push(t);
			}
		}
	}
	// 得到裁剪线段的两个端点
	const tmin = Math.max(...t_in, 0);
	const tmax = Math.min(...t_out, 1);
	// 是否位于裁剪区域外部
	if (tmin <= tmax) {
		const xmin = x1 + (x2 - x1) * tmin;
		const ymin = y1 + (y2 - y1) * tmin;
		const xmax = x1 + (x2 - x1) * tmax;
		const ymax = y1 + (y2 - y1) * tmax;
		const newLineSeg = [
			[xmin, ymin],
			[xmax, ymax],
		];
		result.push(newLineSeg);
	}
	return result;
}

// 多线段裁剪
function clipLinesegs(linesegs, lines) {
	const result = [];
	for (let i = 0; i < linesegs.length; i++) {
		const lineseg = linesegs[i];
		result.push(...clipLineseg(lineseg, lines));
	}
	return result;
}

// 多边形裁剪
function clipPolygon(polygon, lines) {
	// 待裁剪多边形转为线段集合
	const linesegs = [];
	for (let i = 0; i < polygon.length; i++) {
		const lineseg =
			i === polygon.length - 1 ? [polygon[polygon.length - 1], polygon[0]] : [polygon[i], polygon[i + 1]];
		linesegs.push(lineseg);
	}
	// 线段集合依次与每条边界进行裁剪
	let clip_linesegs = linesegs;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		clip_linesegs = clipLinesegs(clip_linesegs, [line]);
	}
	// 将裁剪后的线段组装成多边形
	const result = [];
	for (let i = 0; i < clip_linesegs.length; i++) {
		const pre = clip_linesegs[i];
		const next = i === clip_linesegs.length - 1 ? clip_linesegs[0] : clip_linesegs[i + 1];
		const { x: xp, y: yp } = pre[1];
		const { x: xn, y: yn } = next[0];
		// 判断两点是否重合
		if (xp === xn && yp === yn) {
			result.push(pre[0], pre[1], next[1]);
		} else {
			result.push(pre[0], pre[1], next[0], next[1]);
		}
	}
	return result;
}

// 多个多边形被裁剪区域裁剪
function clipPolygons(polygons, lines) {
	const result = [];
	for (let i = 0; i < polygons.length; i++) {
		const r = clipPolygon(polygons[i], lines);
		if (r.length) {
			result.push(r);
		}
	}
	return result;
}

// 根据图元类型执行裁剪
const _clip = (type, primitive) => {
	let newPrimitives = [];
	switch (type) {
		case 'GL_POINTS': {
			const point = primitive;
			const { gl_Position } = point;
			const x = gl_Position[0];
			const y = gl_Position[1];
			const z = gl_Position[2];
			const w = gl_Position[3];
			const min = -w;
			const max = w;
			// 判断点和裁剪空间六个包围面的关系：x=w，x=-w，y=w，y=-w，z=w，z=-w
			if (x < min || x > max || y < min || y > max || z < min || z > max) {
				// 点在包围盒外
			} else {
				// 点在包围盒内
				newPrimitives.push(primitive);
			}
			break;
		}
		case 'GL_LINE_STRIP': {
			break;
		}
		case 'GL_TRIANGLES': {
			break;
		}
		default: {
			break;
		}
	}
	return newPrimitives;
};
