import { vec3 } from './gl-matrix-min';
/**
 * 数学方法
 */

// 数字裁剪
export const clamp = (x, min, max) => {
	x = x <= min ? min : x >= max ? max : x;
	return x;
};

/**
 * 球面弧方法二维向量转三维向量
 * @param {*} px x坐标
 * @param {*} py y坐标
 * @param {*} width 屏幕宽度
 * @param {*} height 屏幕高度
 */
export const arcball = (px, py, width, height) => {
	let x = (2.0 * px) / width - 1.0;
	let y = 1.0 - (2.0 * py) / height;
	let z = 0.0;
	const square = x * x + y * y;
	if (square <= 1.0) {
		z = Math.sqrt(1 - square);
	} else {
		const length = Math.sqrt(square);
		x /= length;
		y /= length;
		z = 0.0;
	}
	return vec3.fromValues(x, y, z);
};
