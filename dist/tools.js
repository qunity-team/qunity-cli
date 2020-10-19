"use strict";
/**
 * Created by rockyl on 2018/7/5.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const crypto = require("crypto");
const fs = require("fs-extra");
function exit(err, code = 1) {
    console.error(err);
    process.exit(code);
}
exports.exit = exit;
function childProcess(cmd, params, cwd, printLog = true) {
    let options = {};
    if (cwd) {
        options.cwd = cwd;
    }
    const proc = child_process_1.spawn(cmd, params, options);
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
exports.childProcess = childProcess;
function childProcessSync(cmd, params, cwd, printLog = true) {
    return new Promise((resolve, reject) => {
        let proc = childProcess(cmd, params, cwd, printLog);
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(code);
            }
        });
    });
}
exports.childProcessSync = childProcessSync;
function gitClone(url, path) {
    return childProcessSync('git', ['clone', url, path], path);
}
exports.gitClone = gitClone;
function npmInstall(path) {
    return childProcessSync('npm', ['i'], path);
}
exports.npmInstall = npmInstall;
function npmRun(path, scriptName) {
    return childProcessSync('npm', ['run', scriptName], path);
}
exports.npmRun = npmRun;
function getMd5(fileOrBuffer) {
    let buffer = fileOrBuffer;
    if (typeof fileOrBuffer === 'string') {
        buffer = fs.readFileSync(fileOrBuffer);
    }
    let hash = crypto.createHash('md5');
    hash.update(buffer);
    return hash.digest('hex');
}
exports.getMd5 = getMd5;
//# sourceMappingURL=tools.js.map