"use strict";
/**
 * Created by rockyl on 2020-03-17.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMetaFiles = void 0;
const glob_1 = require("glob");
const chalk = require("chalk");
const fs_extra_1 = require("fs-extra");
const tools_1 = require("../tools");
function clearMetaFiles() {
    if (fs_extra_1.default.existsSync('assets')) {
        executeOnce();
        console.log(chalk.cyan('clear meta files successfully'));
    }
    else {
        tools_1.exit('assets folder not exists', 1);
    }
}
exports.clearMetaFiles = clearMetaFiles;
function executeOnce() {
    let files = glob_1.default.sync('assets/**/*.meta');
    for (let file of files) {
        let bodyFile = file.replace('.meta', '');
        if (!fs_extra_1.default.existsSync(bodyFile)) {
            fs_extra_1.default.unlinkSync(file);
            console.log(chalk.green('remove ' + file + '.meta'));
        }
    }
}
//# sourceMappingURL=clear.js.map