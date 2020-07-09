/**
 * Created by rockyl on 2020-03-17.
 */

import glob from 'glob'
import chalk from 'chalk'
import fs from 'fs'
import {exit} from "../tools";

export function clearMetaFiles() {
	if (fs.existsSync('assets')) {
		executeOnce();
		console.log(chalk.cyan('clear meta files successfully'));
	} else {
		exit('assets folder not exists', 1);
	}
}

function executeOnce() {
	let files = glob.sync('assets/**/*.meta');

	for (let file of files) {
		let bodyFile = file.replace('.meta', '');
		if (!fs.existsSync(bodyFile)) {
			fs.unlinkSync(file);
			console.log(chalk.green('remove ' + file + '.meta'));
		}
	}
}
