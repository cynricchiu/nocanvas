import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ command, mode, ssrBuild }) => {
	const common = {
		publicDir: 'public',
		resolve: {
			alias: {
				'@styles': path.resolve(__dirname, './src/styles'),
				'@images': path.resolve(__dirname, './src/images'),
			},
		},
	};
	if (command === 'serve') {
		// dev环境
		return {
			...common,
			server: {
				host: 'localhost',
				port: '8080',
				open: true,
				https: false,
				cors: true,
			},
			build: {
				rollupOptions: {
					input: {
						index: path.resolve(__dirname, 'index.html'),
						demo: path.resolve(__dirname, 'demo/createMap.html'),
					},
				},
			},
		};
	} else {
		if (mode !== 'lib') {
			// build环境，普通打包模式，command === 'build'
			return {
				...common,
				// 打包配置
				build: {
					target: 'modules',
					outDir: 'dist', //指定输出路径
					assetsDir: 'assets', // 指定生成静态资源的存放路径
					minify: 'terser', // terser需要另行安装
					rollupOptions: {
						input: path.resolve(__dirname, './src/main.js'), // 打包入口文件
						output: {
							// 最小化拆分包
							manualChunks: id => {
								if (id.includes('node_modules')) {
									return id.toString().split('node_modules/')[1].split('/')[0].toString();
								}
							},
							entryFileNames: 'js/[name].[hash].js',
							chunkFileNames: 'js/[name].[hash].js',
							assetFileNames: '[ext]/[name].[hash].[ext]',
							globals: {
								react: 'React',
							},
						},
						external: ['react'], // 不需要打包的文件
					},
				},
			};
		} else {
			// build环境，但是lib模式
			return {
				...common,
				// 打包配置
				build: {
					target: 'modules',
					outDir: 'dist', //指定输出路径
					assetsDir: 'assets', // 指定生成静态资源的存放路径
					minify: 'terser', // terser需要另行安装
					lib: {
						entry: path.resolve(__dirname, './src/main.js'),
						name: 'mylib',
						fileName: format => `mylib.${format}.js`,
					},
				},
			};
		}
	}
});
