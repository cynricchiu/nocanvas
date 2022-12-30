/**
 * 工具方法
 */

// 生成唯一id或标准UUID
export const getUUID = (length, radix) => {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
	let uuid = [];
	radix = radix || chars.length;
	if (length) {
		for (let i = 0; i < length; i++) {
			uuid[i] = chars[0 | (Math.random() * radix)];
		}
	} else {
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4';
		for (let i = 0; i < 36; i++) {
			if (!uuid[i]) {
				const r = 0 | (Math.random() * 16);
				uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
			}
		}
	}
	return uuid.join('');
};

// 函数节流
export const throttle = (fn, ctx) => {
	let lock = false;
	return function (...args) {
		if (lock) return;
		lock = true;
		requestAnimationFrame(() => {
			fn.call(ctx, ...args);
			lock = false;
		});
	};
};

// 函数防抖
export const debounce = (fn, ctx, wait) => {
	let timer = null;
	return function (...args) {
		if (timer !== null) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			fn.call(ctx, ...args);
		}, wait);
	};
};

// 浏览器兼容前缀
const getPrefixed = name => {
	return window[`webkit${name}`] || window[`moz${name}`] || window[`ms${name}`];
};

// 兼容requestAnimationFrame
export const requestAnimationFrame = fn => {
	const requestAnimFr = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame');
	return requestAnimFr.call(window, fn);
};

export const cancelAnimationFrame = rafId => {
	const cancelAnimFr =
		window.cancelAnimationFrame ||
		getPrefixed('CancelAnimationFrame') ||
		getPrefixed('CancelRequestAnimationFrame') ||
		function (id) {
			window.clearTimeout(id);
		};

	return cancelAnimFr.call(window, rafId);
};

// 设置对象属性，支持键值映射
export const setProperty = (obj, style, keyRelation = {}) => {
	if (!obj) return;
	for (let key in style) {
		if (keyRelation[key] !== undefined) {
			obj[keyRelation[key]] = style[key];
			continue;
		}
		obj[key] = style[key];
	}
	return obj;
};

// Dom常用操作
export const Dom = {
	// 设置位置
	setPosition: (el, offset) => {
		Dom.setTransform(el, offset); // transform性能好
	},

	// 设置transform
	setTransform: (el, offset, scale) => {
		if (!el) return;
		el.style['transform-origin'] = '0 0';
		el.style.transform = `translate3d(${offset.x}px,${offset.y}px,0)${scale ? ` scale(${scale})` : ''}`;
	},

	// 设置style
	setCSSStyle: (el, style) => {
		setProperty(el.style, style);
	},

	create: (tagName, style) => {
		const el = document.createElement(tagName);
		Dom.setCSSStyle(el, style);
		return el;
	},

	// 从父节点删除
	remove: el => {
		if (!el) return;
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	},

	//删除所有子元素
	removeAllChildren: el => {
		if (!el) return;
		while (el.firstChild) {
			el.removeChild(el.firstChild);
		}
	},

	// 事件监听
	on: (el, type, fn, ctx, ...args) => {
		if (!el) return;
		// 滚轮事件兼容
		if (type === 'scroll') {
			el.addEventListener(
				'DOMMouseScroll',
				e => {
					fn.call(ctx, e, ...args);
				},
				false
			);
			el.onmousewheel = e => {
				fn.call(ctx, e, ...args);
			};
		} else if (type === 'resize') {
			// resize监听
			window.resizeEvents = window.resizeEvents || {};
			window.resizeEvents[el.id] = { fn, args };
			window.resizeObserver =
				window.resizeObserver ||
				new ResizeObserver(entries => {
					for (const entry of entries) {
						const event = window.resizeEvents[entry.target.id];
						if (event) {
							event.fn.call(ctx, ...event.args);
						}
					}
				});
			window.resizeObserver.observe(el);
		} else {
			el.addEventListener(
				type,
				e => {
					fn.call(ctx, e, ...args);
				},
				false
			);
		}
	},

	off: (el, type, fn) => {
		if (!el) return;
		if (type === 'scroll') {
			el.removeEventListener('DOMMouseScroll', fn, false);
			el.onmousewheel = null;
		} else if (type === 'resize') {
			if (window.resizeObserver) {
				window.resizeEvents = window.resizeEvents || {};
				delete window.resizeEvents[el.id];
				window.resizeObserver.unobserve(el);
			}
		} else {
			el.removeEventListener(type, fn, false);
		}
	},
};

// 浏览器常用操作
export const Browser = {
	getRetina: () => {
		return window.devicePixelRatio > 1 ? 2 : 1;
	},
};

// 简单diff算法:返回obj2较obj1中key相同值类型相同但值不同的键值对
export const diffObject = (obj1, obj2, result = {}) => {
	// 只比较同类型的值
	if (typeof obj1 === typeof obj2) {
		if (typeof obj1 === 'object') {
			for (let key in obj1) {
				const value1 = obj1[key];
				const value2 = obj2[key];
				if (typeof value1 === typeof value2) {
					// 函数
					if (typeof value1 === 'function' && value1.toString() !== value2.toString()) {
						result[key] = value2;
					}
					// 数组
					else if (Array.isArray(value1)) {
					}
				}
			}
		} else {
			// 非对象不深入比较
		}
	}
	return result;
};

// 比较两个变量是否同类型且相等
// const equals = (a, b) => {
// 	if (typeof a !== typeof b) {
// 		return false;
// 	} else {
// 		if (typeof a === 'object' && a !== null) {
// 		} else if (typeof a === 'function') {
// 			// 简单判断函数是否相等(转为字符串替换入参)
// 			const stra = a.toString().trim();
// 			const strb = b.toString().trim();
// 			const argsa = stra.slice(stra.indexOf('('), stra.indexOf(')')).split(',');
// 			const argsb = stra.slice(strb.indexOf('('), strb.indexOf(')')).split(',');
// 		} else {
// 			return a === b;
// 		}
// 	}
// };

/**
 * 将函数转为字符串，替换成相同的形参，若相等，则视为函数相等
 * @param {*} a 函数a
 * @param {*} b 函数b
 */
const equal = (a, b) => {
	// 转为字符串
	let strA = a.toString();
	let strB = b.toString();

	// 格式化
	function fromat(str) {
		str = str.replaceAll(/\/\/[^\n]+\n/g, '\n'); // 去掉注释 //
		str = str.replaceAll(/\/\*[\S\s]+\*\//g, '\n'); // 去掉注释 /**/
		str = str.replaceAll(/;[\s]+\n/g, ';'); // 去掉分号后的空字符
		str = str.replaceAll(/[ ]+/g, ' '); // 将多空格缩短为一个空格
		str = str.replaceAll(/[\n\r\t]+/g, ''); // 将多换行多制表缩短为一个换行
		return str;
	}
	strA = fromat(strA);
	strB = fromat(strB);

	// 提取形参
	function getArgs(str) {
		const args = str
			.slice(str.indexOf('(') + 1, str.indexOf(')'))
			.replaceAll(' ', '')
			.split(',');
		return args;
	}
	const argsA = getArgs(strA);
	const argsB = getArgs(strB);
	// strB替换成和strA相同的形参
	function setSameArgs(strB, argsA, argsB) {
		for (let i = 0; i < argsB.length; i++) {
			// 不需要替换的场景
			// this.a || this.['a'] || this.["a"]
			// 需要替换的场景
			// ...a || this.[a] || a[0] || a.length
			strB = strB.replaceAll(new RegExp(`([^.'"\\w]|[.]{3})${argsB[i]}\\W`, 'g'), s => {
				return s.replaceAll(/[0-9a-zA-Z_]+/g, argsA[i]);
			});
		}
		return strB;
	}
	strB = setSameArgs(strB, argsA, argsB);
	return strA === strB;
};
