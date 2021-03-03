"use strict";
/**
 * Created by rockyl on 2020-03-16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const targetId = 'register-scripts';
function getModuleName(file) {
    let metaFile = file + '.meta';
    if (!fs.existsSync(metaFile)) {
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
    let index = 0;
    for (let file of files) {
        let moduleName = getModuleName(file);
        if (moduleName) {
            let localModuleName = '/' + path.relative('./assets', file).replace('.ts', '');
            scriptsImportList.push(`import {default as script_${index}} from "${file}";`);
            scriptsList.push(`'uuid://${moduleName}': script_${index},`);
            scriptsList.push(`'${localModuleName}': script_${index},`);
            index++;
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
function dealScriptsDependencies() {
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
    };
}
exports.dealScriptsDependencies = dealScriptsDependencies;
//# sourceMappingURL=deal-scripts-dependencies.js.map