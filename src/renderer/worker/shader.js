importScripts('raster.js', './primitive.js');

// 着色器
class Shader {
	constructor({ width, height, type, attributes, uniforms, vert, frag }) {
		this.type = type; // 图元类型
		this.width = width;
		this.height = height;
		this.attributes = attributes; // 每个顶点各自适用的变量
		this.uniforms = uniforms; // 适用所有顶点的变量
		this.varying = {}; // 内部传递变量
		this.vertShaderFunc = new Function(`return ${vert}`)(); // 字符串转函数
		this.fragShaderFunc = new Function(`return ${frag}`)();
		this._createVBO(attributes);
	}

	// step1: 建立顶点缓冲区对象(VBO)
	// 输入：attribute变量
	// 输出：VBO
	_createVBO(attributes) {
		this.VBO = JSON.parse(JSON.stringify(this.attributes)); // 对attribute进行深拷贝
		// this.VBO = JSON.parse(JSON.stringify(attributes)); // 对attribute进行深拷贝
		// const positions = this.attributes.positions;
		// const colors = this.attributes.colors;
		// const normals = this.attributes.normals;
		// const indices = this.attributes.indices;
		// // 开辟连续缓存，固定大小
		// // position|normal: vec3 字节长度3*4，color: vec4 字节长度4*4，indices: Uint32 字节长度4*1
		// const byteSize = positions.length * 16 + colors.length * 16 + normals.length * 12 + indices.length * 4;
		// this.VBO = new ArrayBuffer(byteSize);
		// this.positionsArray = new Float32Array(this.VBO, 0, positions.length * 3);
		// this.colorsArray = new Float32Array(this.VBO, this.positionsArray.byteLength, colors.length * 4);
		// this.normalsArray = new Float32Array(this.VBO, this.colorsArray.byteLength, normals.length * 3);
		// this.indicesArray = new Uint32Array(this.VBO, this.normalsArray.byteLength, indices.length * 1);
		// this.positionsArray.set(positions);
		// this.colorsArray.set(colors);
		// this.normalsArray.set(normals);
		// this.indicesArray.set(indices);
	}

	// step2: 逐顶点执行顶点着色器
	// 依次对每个顶点坐标变换，将顶点转换到裁剪空间
	// 输入：VBO
	// 输出：vertexCacheArray 暂存执行结果
	_toClipSpace() {
		if (!this.vertexCacheArray) {
			this.vertexCacheArray = new Array(this.VBO.positions.length);
		}
		for (let i = 0; i < this.VBO.positions.length; i++) {
			const { gl_Position, gl_PointSize, varyings } = this.vertShaderFunc.call(null, i, this.VBO, this.uniforms);
			const vertex = { gl_Position, gl_PointSize: gl_PointSize || 1, gl_VertexID: i, varyings };
			this.vertexCacheArray[i] = vertex;
		}
	}

	// step3: 图元装配 + 图元裁剪
	// 输入：VBO
	// 输出：图元索引缓冲对象(EBO)
	_processPrimitive() {
		const indices = this.VBO.indices;
		// GL_POINTS|GL_LINE_STRIP|GL_TRIANGLES
		switch (this.type) {
			case GL_ENUM_MODE.GL_POINTS: {
				const points = [];
				for (let i = 0; i < indices.length; i++) {
					const index = indices[i];
					const vertex = this.vertexCacheArray[index];
					const point = vertex;
					// const newPoints = _clip(this.type, point);
					// points.push(...newPoints);
					points.push(point);
				}
				this.EBO = points;
				break;
			}
			case GL_ENUM_MODE.GL_LINES: {
				const lines = [];
				for (let i = 0; i < indices.length; i += 2) {
					const v1 = this.vertexCacheArray[indices[i]];
					const v2 = this.vertexCacheArray[indices[i + 1]];
					const line = [v1, v2];
					// const newPoints = _clip(this.type, point);
					// points.push(...newPoints);
					lines.push(line);
				}
				this.EBO = lines;
				break;
			}
			case GL_ENUM_MODE.GL_LINE_STRIP: {
				const lines = [];
				for (let i = 0; i < indices.length - 1; i++) {
					const v1 = this.vertexCacheArray[indices[i]];
					const v2 = this.vertexCacheArray[indices[i + 1]];
					const line = [v1, v2];
					// const newPoints = _clip(this.type, point);
					// points.push(...newPoints);
					lines.push(line);
				}
				this.EBO = lines;
				break;
			}
			case GL_ENUM_MODE.GL_LINE_LOOP: {
				const lines = [];
				for (let i = 0; i < indices.length; i++) {
					if (i === indices.length - 1) {
						const v1 = this.vertexCacheArray[indices[i]];
						const v2 = this.vertexCacheArray[indices[0]];
						const line = [v1, v2];
						lines.push(line);
					} else {
						const v1 = this.vertexCacheArray[indices[i]];
						const v2 = this.vertexCacheArray[indices[i + 1]];
						const line = [v1, v2];
						// const newPoints = _clip(this.type, point);
						// points.push(...newPoints);
						lines.push(line);
					}
				}
				this.EBO = lines;
				break;
			}
			case GL_ENUM_MODE.GL_TRIANGLES: {
				const triangles = [];
				for (let i = 0; i < indices.length; i += 3) {
					const v1 = this.vertexCacheArray[indices[i]];
					const v2 = this.vertexCacheArray[indices[i + 1]];
					const v3 = this.vertexCacheArray[indices[i + 2]];
					const triangle = [v1, v2, v3];
					// const newPoints = _clip(this.type, point);
					// points.push(...newPoints);
					triangles.push(triangle);
				}
				this.EBO = triangles;
				break;
			}
			case GL_ENUM_MODE.GL_TRIANGLE_STRIP: {
				const triangles = [];
				for (let i = 2; i < indices.length; i++) {
					if (i % 2 === 0) {
						// 顶点数为奇数
						const v1 = this.vertexCacheArray[indices[i - 2]];
						const v2 = this.vertexCacheArray[indices[i - 1]];
						const v3 = this.vertexCacheArray[indices[i]];
						const triangle = [v1, v2, v3];
						// const newPoints = _clip(this.type, point);
						// points.push(...newPoints);
						triangles.push(triangle);
					} else {
						// 偶数
						const v1 = this.vertexCacheArray[indices[i - 1]];
						const v2 = this.vertexCacheArray[indices[i - 2]];
						const v3 = this.vertexCacheArray[indices[i]];
						const triangle = [v1, v2, v3];
						// const newPoints = _clip(this.type, point);
						// points.push(...newPoints);
						triangles.push(triangle);
					}
				}
				this.EBO = triangles;
				break;
			}
			case GL_ENUM_MODE.GL_TRIANGLE_FAN: {
				const triangles = [];
				const v0 = this.vertexCacheArray[indices[0]];
				for (let i = 1; i < indices.length - 1; i++) {
					const v1 = this.vertexCacheArray[indices[i]];
					const v2 = this.vertexCacheArray[indices[i + 1]];
					const triangle = [v0, v1, v2];
					// const newPoints = _clip(this.type, point);
					// points.push(...newPoints);
					triangles.push(triangle);
				}
				this.EBO = triangles;
				break;
			}
			default: {
				break;
			}
		}
	}

	// step4: 裁剪空间-NDC空间-视口空间
	// 输入：EBO
	// 输出：EBO
	_toViewPortSpace() {
		switch (this.type) {
			case GL_ENUM_MODE.GL_POINTS: {
				for (let i = 0; i < this.EBO.length; i++) {
					const vertex = this.EBO[i];
					const { gl_Position, gl_PointSize } = vertex;
					// 裁剪空间-NDC空间：透视除法
					const position = vec4.fromValues(
						gl_Position[0] / gl_Position[3],
						gl_Position[1] / gl_Position[3],
						gl_Position[2] / gl_Position[3],
						1
					);
					// NDC空间-视口空间：得到屏幕坐标
					vec4.transformMat4(position, position, this.uniforms.viewportMatrix);
					// 取整
					this.EBO[i]['screenPosition'] = [
						Math.floor(position[0]),
						Math.floor(position[1]),
						Math.floor(position[2]), // 深度
						1,
					];
					// const z = position[2];
					// this.EBO[i]['gl_PointSize'] = Math.floor(gl_PointSize / z); // 点的大小与1/z有关
				}
				break;
			}
			case GL_ENUM_MODE.GL_LINES:
			case GL_ENUM_MODE.GL_LINE_STRIP:
			case GL_ENUM_MODE.GL_LINE_LOOP: {
				for (let i = 0; i < this.EBO.length; i++) {
					const line = this.EBO[i];
					for (let i = 0; i < line.length; i++) {
						const vertex = line[i];
						const { gl_Position } = vertex;
						const position = vec4.fromValues(
							gl_Position[0] / gl_Position[3],
							gl_Position[1] / gl_Position[3],
							gl_Position[2] / gl_Position[3],
							1
						);
						vec4.transformMat4(position, position, this.uniforms.viewportMatrix);
						// 取整
						line[i]['screenPosition'] = [
							Math.floor(position[0]),
							Math.floor(position[1]),
							Math.floor(position[2]),
							Math.floor(position[3]),
						];
					}
				}
				break;
			}
			case GL_ENUM_MODE.GL_TRIANGLES:
			case GL_ENUM_MODE.GL_TRIANGLE_STRIP:
			case GL_ENUM_MODE.GL_TRIANGLE_FAN: {
				for (let i = 0; i < this.EBO.length; i++) {
					const triangle = this.EBO[i];
					for (let i = 0; i < triangle.length; i++) {
						const vertex = triangle[i];
						const { gl_Position } = vertex;
						const position = vec4.fromValues(
							gl_Position[0] / gl_Position[3],
							gl_Position[1] / gl_Position[3],
							gl_Position[2] / gl_Position[3],
							1
						);
						vec4.transformMat4(position, position, this.uniforms.viewportMatrix);
						// 取整
						triangle[i]['screenPosition'] = [
							Math.floor(position[0]),
							Math.floor(position[1]),
							Math.floor(position[2]),
							Math.floor(position[3]),
						];
					}
				}
				break;
			}
			default: {
				break;
			}
		}
	}

	// step5: 光栅化
	// 输入：EBO
	// 输出：颜色缓存
	_rasterization() {
		// 颜色缓存
		if (!this.colorBuffer) {
			this.colorBuffer = new Uint8ClampedArray(this.width * this.height * 4);
		}
		this.colorBuffer.fill(0);
		switch (this.type) {
			case GL_ENUM_MODE.GL_POINTS: {
				rasterPoint(this.EBO, this.colorBuffer, this.width, this.height);
				break;
			}
			case GL_ENUM_MODE.GL_LINES:
			case GL_ENUM_MODE.GL_LINE_STRIP:
			case GL_ENUM_MODE.GL_LINE_LOOP: {
				rasterLines(this.EBO, this.colorBuffer, this.width, this.height);
				break;
			}
			case GL_ENUM_MODE.GL_TRIANGLES:
			case GL_ENUM_MODE.GL_TRIANGLE_STRIP:
			case GL_ENUM_MODE.GL_TRIANGLE_FAN: {
				rasterTriangles(this.EBO, this.colorBuffer, this.width, this.height);
				break;
			}
			default: {
				break;
			}
		}
	}

	// step6: 逐片元执行片元着色器
	_frag() {}

	// 执行着色器
	execute = () => {
		this._toClipSpace();
		this._processPrimitive();
		this._toViewPortSpace();
		this._rasterization();
	};

	// 销毁
	destroy = () => {
		this.VBO = null;
	};

	// 更新属性
	updateProps(props) {
		const { attributes, uniforms, vert, frag } = props;
		this.attributes = attributes ? { ...this.attributes, ...attributes } : this.attributes;
		this.uniforms = uniforms ? { ...this.uniforms, ...uniforms } : this.uniforms;
		this.vertShaderFunc = vert ? new Function(`return ${vert}`)() : this.vertShaderFunc;
		this.fragShaderFunc = frag ? new Function(`return ${frag}`)() : this.fragShaderFunc;
		// 是否需要更新vbo
		const needUpdateVBO = attributes !== undefined ? !!Object.keys(attributes).length : false;
		if (needUpdateVBO) {
			this._createVBO();
		}
		// 是否需要重新执行
		const needUpdate =
			attributes !== undefined || uniforms !== undefined || vert !== undefined || frag !== undefined;
		this.needUpdate = needUpdate;
		if (needUpdate) {
			this.execute();
		}
	}
}
