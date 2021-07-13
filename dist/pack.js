"use strict";
/**
 * Created by rockyl on 2020-05-12.
 *
 * pack project
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const glob = require("glob");
const compile_1 = require("./compile");
const doc_1 = require("./doc");
//import * as packSheet from "sheet-packer"
const tools_1 = require("./tools");
const node_html_parser_1 = require("node-html-parser");
const releasePath = 'dist';
const assetProtocol = 'asset://';
async function pack(options) {
    if (!fs.existsSync('manifest.json')) {
        tools_1.exit(`file [manifest.json] not exists`, 1);
    }
    let manifest = fs.readJSONSync('manifest.json');
    let releaseVersion = options.releaseVersion || Date.now().toString();
    let projectReleasePath = path.join(releasePath, releaseVersion);
    await fs.ensureDir(projectReleasePath);
    const bundleFile = await compileBundle(options, manifest, projectReleasePath);
    //await packSheets(projectReleasePath)
    const scriptMapping = await parseIndexHtml(projectReleasePath, bundleFile);
    await copyFiles(projectReleasePath, scriptMapping);
}
exports.pack = pack;
async function compileBundle(options, manifest, projectReleasePath) {
    let bundleFile = path.join(projectReleasePath, 'index.min.js');
    let compileOptions = {
        prod: options.prod,
        outputFile: bundleFile,
        manifest,
    };
    await compile_1.compile(compileOptions);
    return bundleFile;
}
function assetsTokenFilter(token) {
    return token.type === 'String' && token.value.startsWith('\'' + assetProtocol);
}
async function packSheets(projectReleasePath) {
    let assetsPath = 'assets';
    let projectReleaseAssetsPath = path.join(projectReleasePath, 'assets');
    await fs.ensureDir(projectReleaseAssetsPath);
    let sceneFiles = glob.sync(assetsPath + '/**/*.qnt');
    for (let sceneFile of sceneFiles) {
        let sceneContent = await fs.readFile(sceneFile, 'utf-8');
        let doc = doc_1.getDoc(sceneContent);
        let assets = doc.assets;
        let files = assets.map(asset => asset.url).filter(asset => asset.endsWith('.png'));
        let { sheets, singles } = await packSheet(files, {});
        //console.log(assets, sheets, singles)
        let sheetIndex = 0;
        for (let { frames, buffer } of sheets) {
            let keys = Object.keys(frames);
            for (let url of keys) {
                let asset = assets.find(asset => asset.url === url);
                if (asset) {
                    let relativePath = path.relative('assets', url);
                    frames[relativePath] = frames[url];
                    delete frames[url];
                    frames[relativePath].uuid = asset.uuid;
                }
            }
            await fs.writeFile(path.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.sht'), JSON.stringify(frames));
            await fs.writeFile(path.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.png'), buffer);
            sheetIndex++;
        }
        for (let single of singles) {
            await fs.copy(single, path.join(projectReleasePath, single));
        }
    }
}
async function parseIndexHtml(projectReleasePath, bundleFile) {
    let scriptMapping = {};
    let indexTemplate = await fs.readFile('index.html', 'utf-8');
    const html = node_html_parser_1.parse(indexTemplate);
    let scriptEls = html.querySelectorAll('script');
    for (let scriptEl of scriptEls) {
        let src = scriptEl.getAttribute('src');
        if (!src) {
            continue;
        }
        let newSrc = src;
        if (src === 'debug/index.js') {
            newSrc = path.relative(projectReleasePath, bundleFile);
        }
        else if (src.startsWith('node_modules/')) {
            let moduleName = src.split('/')[1] + '.js';
            let scriptPath = 'libs/' + moduleName;
            scriptMapping[src] = moduleName;
            newSrc = scriptPath;
        }
        if (newSrc !== src) {
            scriptEl.setAttribute('src', newSrc);
        }
    }
    await fs.writeFile(path.join(projectReleasePath, 'index.html'), html.toString());
    return scriptMapping;
}
async function copyFiles(projectReleasePath, scriptMapping) {
    let libsPath = path.join(projectReleasePath, 'libs');
    await fs.ensureDir(libsPath);
    for (let key in scriptMapping) {
        await fs.copyFile(key, path.join(libsPath, scriptMapping[key]));
    }
    await fs.copyFile('manifest.json', path.join(projectReleasePath, 'manifest.json'));
    //todo copy assets without **/*.png if pack-sheets
    let assetsPath = 'assets';
    await fs.copy(assetsPath, path.join(projectReleasePath, assetsPath), {
        filter: (src, dest) => {
            let pass = true;
            if (src.endsWith('.ts') || src.endsWith('.meta')) {
                pass = false;
            }
            return pass;
        }
    });
}
//# sourceMappingURL=pack.js.map