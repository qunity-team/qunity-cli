"use strict";
/**
 * Created by rockyl on 2020-03-16.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetaFile = exports.generateMetaFiles = void 0;
const path = require("path");
const glob = require("glob");
const chalk = require("chalk");
const fs = require("fs-extra");
const uuid_1 = require("uuid");
const chokidar = require("chokidar");
const tools_1 = require("../tools");
const ts_declare_generator_1 = require("../ts-declare-generator");
let t;
function generateMetaFiles(watch = false) {
    if (fs.existsSync('assets')) {
        if (watch) {
            console.log(chalk.blue('start watch assets folder to generate meta files'));
            chokidar.watch('assets').on('all', (event, path) => {
                //console.log(event, path)
                if (t) {
                    clearTimeout(t);
                    t = null;
                }
                t = setTimeout(executeOnce, 200);
            });
        }
        else {
            executeOnce();
            console.log(chalk.cyan('generate meta files successfully'));
        }
    }
    else {
        tools_1.exit('assets folder not exists', 1);
    }
}
exports.generateMetaFiles = generateMetaFiles;
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
        let md5 = tools_1.getMd5(file);
        if (meta.md5 !== md5) {
            meta.declaration = ts_declare_generator_1.generateDeclaration(file);
            meta.md5 = md5;
            saveMetaFile(file, meta);
        }
    }
    console.timeEnd('generateDeclaration>');
}
function generateMetaFile(file) {
    let meta = {
        ver: '1.0.1',
        uuid: uuid_1.v4(),
        extname: path.extname(file),
    };
    saveMetaFile(file, meta);
    console.log(chalk.green('generate ' + file + '.meta'));
    return meta;
}
exports.generateMetaFile = generateMetaFile;
function saveMetaFile(file, meta) {
    fs.writeFileSync(file + '.meta', JSON.stringify(meta, null, '\t'));
}
//# sourceMappingURL=generator.js.map