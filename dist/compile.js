"use strict";
/**
 * Created by rockyl on 2020-03-18.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const fs = require("fs-extra");
const rollup = require("rollup");
const typescript_1 = require("typescript");
const rollup_plugin_terser_1 = require("rollup-plugin-terser");
const plugin_node_resolve_1 = require("@rollup/plugin-node-resolve");
const deal_scripts_dependencies_1 = require("./deal-scripts-dependencies");
const chalk = require("chalk");
const tools_1 = require("./tools");
const chokidar = require("chokidar");
const json = require('@rollup/plugin-json');
const rpt = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const devOutputFile = 'debug/index.js';
const prodOutputFile = 'debug/index.min.js';
const defaultOptions = {
    prod: false,
    externals: {
        qunity: 'qunity',
    },
};
const adaptorExternalMap = {
    pixi: {
        'pixi.js': 'PIXI',
        'qunity-pixi': 'qunity-pixi',
    }
};
const inputFile = 'src/index.ts';
let t;
async function compile(options, watch = false) {
    if (!fs.existsSync('src/index.ts')) {
        tools_1.exit(`file [${inputFile}] not exists`, 1);
    }
    if (options) {
        options = Object.assign({}, defaultOptions, options);
    }
    else {
        options = Object.assign({}, defaultOptions);
    }
    let { name: moduleName, engine: adaptor, externals: manifestExternals } = options.manifest;
    let { prod, outputFile } = options;
    if (!outputFile) {
        outputFile = prod ? prodOutputFile : devOutputFile;
    }
    let externals = adaptorExternalMap[adaptor];
    if (!externals) {
        tools_1.exit(`adaptor [${adaptor}] not exists`, 2);
    }
    externals = Object.assign({}, externals, defaultOptions.externals, manifestExternals);
    let inputOptions = {
        input: inputFile,
        plugins: [
            json(),
            deal_scripts_dependencies_1.dealScriptsDependencies(),
            plugin_node_resolve_1.default({
                browser: true,
            }),
            rpt({
                typescript: typescript_1.default,
                include: ['src/**/*.ts+(|x)', 'assets/**/*.ts+(|x)'],
            }),
            commonjs(),
            replace({
                'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
            }),
            prod && rollup_plugin_terser_1.terser()
        ],
        external: Object.keys(externals),
    };
    let outputOptions = {
        file: outputFile,
        format: 'umd',
        name: moduleName,
        sourcemap: !prod,
        globals: externals,
    };
    if (watch) {
        let watchOptions = Object.assign(Object.assign({}, inputOptions), { output: outputOptions });
        const watcher = rollup.watch(watchOptions);
        watcher.on('event', event => {
            switch (event.code) {
                case 'START':
                    console.log(chalk.cyan('start building...'));
                    break;
                case 'END':
                    console.log(chalk.cyan('build project successfully'));
                    break;
                case 'ERROR':
                    console.warn(event);
                    break;
            }
            // event.code 会是下面其中一个：
            //   START        — 监听器正在启动（重启）
            //   BUNDLE_START — 构建单个文件束
            //   BUNDLE_END   — 完成文件束构建
            //   END          — 完成所有文件束构建
            //   ERROR        — 构建时遇到错误
            //   FATAL        — 遇到无可修复的错误
        });
        chokidar.watch('assets', {
            //ignored: /^.+(?<!\.ts)$/,
            ignoreInitial: true,
        }).on('all', (event, path) => {
            if (event === 'add' && path.endsWith('.ts')) {
                //console.log(event, path)
                if (t) {
                    clearTimeout(t);
                    t = null;
                }
                t = setTimeout(modifyNeedCompile, 500);
            }
        });
    }
    else {
        try {
            const bundle = await rollup.rollup(inputOptions);
            await bundle.write(outputOptions);
            console.log(chalk.cyan('build project successfully'));
        }
        catch (e) {
            console.warn(e);
            tools_1.exit('build project failed', 1);
        }
    }
}
exports.compile = compile;
function modifyNeedCompile() {
    let content = fs.readFileSync('src/need-compile.ts');
    fs.writeFileSync('src/need-compile.ts', content);
}
//# sourceMappingURL=compile.js.map