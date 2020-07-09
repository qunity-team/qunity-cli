/**
 * Created by rockyl on 2020-03-16.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const targetId = 'register-scripts';

function getModuleName(file) {
	let metaFile = file + '.meta';
	if(!fs.existsSync(metaFile)){
		return;
	}
	let metaContent = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
	let fileContent = fs.readFileSync(file, 'utf-8');
	let result = fileContent.match(/export default class (\w+)/);

	if (result) {
		return metaContent.uuid;
	}
}

function getScripts() {
	let files = glob.sync('./assets/**/*.ts');

	let scriptsImportList = [];
	let scriptsList = [];
	for (let i = 0, li = files.length; i < li; i++) {
		const file = files[i];
		let moduleName = getModuleName(file);
		if (moduleName) {
			let localModuleName = '/' + path.relative('./assets', file).replace('.ts', '');
			scriptsImportList.push(`import {default as script_${i}} from "${file}";`);
			scriptsList.push(`'${moduleName}': script_${i},`);
			scriptsList.push(`'${localModuleName}': script_${i},`);
		}
	}

	return `
${scriptsImportList.join('\n')}

export default function register(app) {
	app.registerComponentDefs({
${scriptsList.join('\n')}
	});
}
`;
}

export function dealScriptsDependencies(options) {
	return {
		name: 'deal-scripts-dependencies',

		resolveId(id) {
			if (id === targetId) {
				return id;
			}

			return null;
		},

		load(id) {
			if (id === targetId) {
				return getScripts();
			}

			return null;
		}
	}

}
