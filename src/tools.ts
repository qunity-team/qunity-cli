/**
 * Created by rockyl on 2018/7/5.
 */

import {spawn} from 'child_process';
import * as crypto from 'crypto';
import * as fs from "fs-extra";

export function exit(err, code = 1) {
	console.error(err);
	process.exit(code);
}

export function childProcess(cmd, params, cwd = process.cwd(), printLog = true) {
	let options: any = {};
	if (cwd) {
		options.cwd = cwd;
	}
	const proc = spawn(cmd, params, options);

	if (printLog) {
		proc.stdout.on('data', (data) => {
			let txt = data.toString();
			txt = txt.substr(0, txt.length - 1);
			console.log(txt);
		});

		proc.stderr.on('data', (data) => {
			console.log(data.toString());
		});
	}

	return proc;
}

export function childProcessSync(cmd, params, cwd?, printLog = true) {
	return new Promise((resolve, reject) => {
		let proc = childProcess(cmd, params, cwd, printLog);

		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(code);
			}
		});
	});
}

export function gitClone(url, path, cwd?) {
	return childProcessSync('git', ['clone', url, path], cwd);
}

export function npmInstall(cwd?) {
	return childProcessSync('npm', ['i'], cwd);
}

export function npmRun(scriptName, cwd?) {
	return childProcessSync('npm', ['run', scriptName], cwd);
}

export function getMd5(fileOrBuffer) {
	let buffer = fileOrBuffer;
	if (typeof fileOrBuffer === 'string') {
		buffer = fs.readFileSync(fileOrBuffer);
	}

	let hash = crypto.createHash('md5');
	hash.update(buffer);
	return hash.digest('hex');
}
