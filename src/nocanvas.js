import { version } from '../package.json';
console.log(
	`%c nocanvas ${version}`,
	'font-size:14px;padding:6px;color:white;background:#032951;border:4px solid #019ed5'
);

export * from './core/index';
