"use strict";
/**
 * Created by rockyl on 2020-05-12.
 *
 * pack project
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const glob_1 = require("glob");
const compile_1 = require("./compile");
const doc_1 = require("./doc");
const sheet_packer_1 = require("sheet-packer");
const tools_1 = require("./tools");
const releasePath = 'dist';
const assetProtocol = 'asset://';
async function pack(options) {
    if (!fs_extra_1.default.existsSync('manifest.json')) {
        tools_1.exit(`file [manifest.json] not exists`, 1);
    }
    let manifest = fs_extra_1.default.readJSONSync('manifest.json');
    let releaseVersion = options.releaseVersion || Date.now().toString();
    let projectReleasePath = path_1.default.join(releasePath, releaseVersion);
    await fs_extra_1.default.ensureDir(projectReleasePath);
    const bundleFile = await compileBundle(options, manifest, projectReleasePath);
    await packSheets(projectReleasePath);
    await parseIndexHtml(projectReleasePath, bundleFile);
    await copyFiles(projectReleasePath);
}
exports.pack = pack;
async function compileBundle(options, manifest, projectReleasePath) {
    let bundleFile = path_1.default.join(projectReleasePath, 'index.min.js');
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
    let projectReleaseAssetsPath = path_1.default.join(projectReleasePath, 'assets');
    await fs_extra_1.default.ensureDir(projectReleaseAssetsPath);
    let sceneFiles = glob_1.default.sync(assetsPath + '/**/*.scene');
    for (let sceneFile of sceneFiles) {
        let sceneContent = await fs_extra_1.default.readFile(sceneFile, 'utf-8');
        let doc = doc_1.getDoc(sceneContent);
        let assets = doc.assets;
        let files = assets.map(asset => asset.url).filter(asset => asset.endsWith('.png'));
        let { sheets, singles } = await sheet_packer_1.default(files, {});
        //console.log(assets, sheets, singles);
        let sheetIndex = 0;
        for (let { frames, buffer } of sheets) {
            let keys = Object.keys(frames);
            for (let url of keys) {
                let asset = assets.find(asset => asset.url === url);
                if (asset) {
                    let relativePath = path_1.default.relative('assets', url);
                    frames[relativePath] = frames[url];
                    delete frames[url];
                    frames[relativePath].uuid = asset.uuid;
                }
            }
            await fs_extra_1.default.writeFile(path_1.default.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.sht'), JSON.stringify(frames));
            await fs_extra_1.default.writeFile(path_1.default.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.png'), buffer);
            sheetIndex++;
        }
        for (let single of singles) {
            await fs_extra_1.default.copy(single, path_1.default.join(projectReleasePath, single));
        }
    }
}
async function parseIndexHtml(projectReleasePath, bundleFile) {
    let indexTemplate = await fs_extra_1.default.readFile('index.html', 'utf-8');
    let indexContent = indexTemplate.replace('debug/index.js', path_1.default.relative(projectReleasePath, bundleFile));
    await fs_extra_1.default.writeFile(path_1.default.join(projectReleasePath, 'index.html'), indexContent);
}
async function copyFiles(projectReleasePath) {
    await fs_extra_1.default.copyFile('index.html', path_1.default.join(projectReleasePath, 'index.html'));
}
//# sourceMappingURL=pack.js.map