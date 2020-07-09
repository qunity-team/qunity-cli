/**
 * Created by rockyl on 2020-03-16.
 */

import glob from 'glob'
import chalk from 'chalk'
import fs from 'fs'
import {v4 as generateUUID} from "uuid"
import chokidar from 'chokidar'
import {exit, getMd5} from "../tools";
import {generateDeclaration} from "../ts-declare-generator";

let t;

export function generateMetaFiles(watch = false) {
	if (fs.existsSync('assets')) {
		if (watch) {
			console.log(chalk.blue('start watch assets folder to generate meta files'));
			chokidar.watch('assets').on('all', (event, path) => {
				//console.log(event, path);
				if (t) {
					clearTimeout(t);
					t = null;
				}
				t = setTimeout(executeOnce, 200);
			});
		} else {
			executeOnce();
			console.log(chalk.cyan('generate meta files successfully'));
		}
	} else {
		exit('assets folder not exists', 1);
	}
}

function executeOnce() {
	let files = glob.sync('assets/**/!(*.meta)');

	for (let file of files) {
		if (!fs.existsSync(file + '.meta')) {
			generateMetaFile(file);
		}
	}

	let tsFiles = glob.sync('assets/**/*.ts');
	console.time('generateDeclaration>');
	for (let file of tsFiles) {
		let meta = JSON.parse(fs.readFileSync(file + '.meta', 'utf-8'));
		let md5 = getMd5(file);
		if (meta.md5 !== md5) {
			meta.declaration = generateDeclaration(file);
			meta.md5 = md5;

			saveMetaFile(file, meta);
		}
	}
	console.timeEnd('generateDeclaration>');
}

export function generateMetaFile(file) {
	let meta = {
		ver: '1.0.1',
		uuid: generateUUID(),
	};

	saveMetaFile(file, meta);

	console.log(chalk.green('generate ' + file + '.meta'));

	return meta;
}

function saveMetaFile(file, meta){
	fs.writeFileSync(file + '.meta', JSON.stringify(meta, null, '\t'));
}
