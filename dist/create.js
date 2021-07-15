"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
/**
 * Created by rockyl on 2020/10/23.
 */
const path = require("path");
const fs = require("fs-extra");
const tools_1 = require("./tools");
const gitHost = 'https://github.com/';
const defaultTemplate = 'qunity-team/sample-blank';
let configFile, config, projectName;
async function create(options) {
    projectName = options.name;
    await prepareProjectPath(options);
    await cloneTemplate(options);
    await prepareConfig();
    if (config)
        await replaceProcess();
    await npm();
    if (config)
        await deleteProcess();
    await windingUp();
    console.log('Create project success');
}
exports.create = create;
async function prepareProjectPath(options) {
    if (options.force) {
        console.log('Deleting the old project');
        await fs.remove(projectName);
    }
    else if (fs.existsSync(projectName)) {
        tools_1.exit(`Project named ${projectName} exist`);
    }
}
async function cloneTemplate(options) {
    console.log('Cloning template...');
    const { name, template = defaultTemplate } = options;
    let gitUrl = `${gitHost}${template}`;
    console.log('Cloning template from', gitUrl);
    await tools_1.gitClone(gitUrl, name).then(() => {
        console.log('Clone template success');
    }, (e) => {
        return Promise.reject('Clone template failed with err:' + e);
    });
}
function prepareConfig() {
    return new Promise((resolve, reject) => {
        configFile = path.resolve(projectName, 'template-config.js');
        if (fs.existsSync(configFile)) {
            config = require(configFile);
        }
        resolve();
    });
}
async function replaceProcess() {
    return new Promise((resolve, reject) => {
        if (config) {
            const { replaces: { constants, contentInFiles, nameOfFiles } } = config;
            constants.projectName = projectName;
            contentInFiles.forEach(file => {
                let filePath = path.resolve(projectName, file);
                let content = fs.readFileSync(filePath, 'utf-8');
                for (let key in constants) {
                    let regexp = new RegExp(`{${key}}`, 'g');
                    content = content.replace(regexp, constants[key]);
                }
                fs.writeFileSync(filePath, content);
            });
            nameOfFiles.forEach(file => {
                let newFile = file;
                let result = newFile.match(/\{\w+\}/g);
                result.forEach(item => {
                    let key = item.substr(1, item.length - 2);
                    newFile = newFile.replace(item, constants[key]);
                });
                fs.moveSync(path.resolve(projectName, file), path.resolve(projectName, newFile));
            });
            resolve();
        }
        else {
            reject('template-config.js is not exist');
        }
    });
}
function deleteProcess() {
    const ps = [];
    const { deletes } = config;
    if (deletes) {
        for (let item of deletes) {
            const file = path.resolve(projectName, item);
            if (fs.existsSync(file)) {
                ps.push(fs.remove(file));
            }
        }
    }
    return Promise.all(ps);
}
async function npm() {
    console.log('Installing packages...');
    await tools_1.yarnInstall(path.resolve(projectName));
    console.log('Installing packages success...');
}
function windingUp() {
    fs.removeSync(configFile);
}
//# sourceMappingURL=create.js.map