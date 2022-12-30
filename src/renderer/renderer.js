import { Dom } from '../util/util';

/**
 * 渲染器(基于canvas,可定义其他渲染器，比如webgl/webgl2/webGPU)
 */
export class CanvasRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this._init();
	}

	_init() {
		// 渲染进程在worker中工作
		this.osc = this.canvas.transferControlToOffscreen();
		if (!this.oscWorker) {
			this.oscWorker = new Worker('../src/renderer/worker/osc.js');
		}
		this.oscWorker.postMessage({ name: 'init', args: [this.osc] }, [this.osc]);
		this.oscWorker.onmessage = e => {
			if (e.data?.renderInfo) {
				// 显示渲染统计信息
				this.showRenderInfo(e.data.renderInfo);
			} else {
				console.log(e.data);
			}
		};
	}

	// 批量添加
	add = addList => {
		this.oscWorker.postMessage({
			name: 'add',
			args: [addList],
		});
	};

	// 批量删除
	remove = removeList => {
		this.oscWorker.postMessage({
			name: 'remove',
			args: [removeList],
		});
	};

	// 批量更新
	update = updateList => {
		this.oscWorker.postMessage({
			name: 'updateProps',
			args: [updateList],
		});
	};

	// 添加fps显示
	showRenderInfo = info => {
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
		this.infoEl.innerHTML = `DRAWCALL: ${info.drawCalls} VERT: ${info.vert} TRI: ${info.tri} FPS: ${info.fps} `;
		Dom.setCSSStyle(this.infoEl, {
			background: info.fps < 40 ? '#ff0000' : '#000000',
		});
	};
}
