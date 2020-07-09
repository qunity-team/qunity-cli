/**
 * Created by rockyl on 2020-05-12.
 *
 * pack project
 */

import path from "path";
import fs from "fs-extra";
import glob from "glob";
import {compile} from "./compile";
import {getDoc} from "./doc";
import {packImages} from "./sheet-pack";

const releasePath = 'dist';
const assetProtocol = 'asset://';

export async function pack(options) {
	if (!fs.existsSync('manifest.json')) {
		exit(`file [manifest.json] not exists`, 1);
	}
	let manifest = JSON.parse(fs.readFileSync('manifest.json'));

	let releaseVersion = options.releaseVersion || Date.now().toString();
	let projectReleasePath = path.join(releasePath, releaseVersion);
	await fs.ensureDir(projectReleasePath);

	//const bundleFile = await compileBundle(options, manifest, projectReleasePath);

	await packSheets(projectReleasePath);
	//await parseIndexHtml(projectReleasePath, bundleFile);
	//await copyFiles(projectReleasePath);
}

async function compileBundle(options, manifest, projectReleasePath) {
	let bundleFile = path.join(projectReleasePath, 'index.min.js');
	let compileOptions = {
		prod: options.prod,
		outputFile: bundleFile,
		manifest,
	};
	await compile(compileOptions);

	return bundleFile;
}

function assetsTokenFilter(token) {
	return token.type === 'String' && token.value.startsWith('\'' + assetProtocol);
}

async function packSheets(projectReleasePath) {
	let assetsPath = 'assets';
	let projectReleaseAssetsPath = path.join(projectReleasePath, 'assets');
	await fs.ensureDir(projectReleaseAssetsPath);

	let sceneFiles = glob.sync(assetsPath + '/**/*.scene');

	for (let sceneFile of sceneFiles) {
		let sceneContent = await fs.readFile(sceneFile, 'utf-8');
		let doc = getDoc(sceneContent);
		let assets = doc.assets;
		let files = assets.map(asset => asset.url).filter(asset => asset.endsWith('.png'));
		let {sheets, singles} = await packSheet(files, {maxSize: 512});

		//console.log(assets, sheets, singles);
		let sheetIndex = 0;
		for (let {frames, buffer} of sheets) {
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
		for(let single of singles){
			await fs.copy(single, path.join(projectReleasePath, single))
		}
	}
}

async function parseIndexHtml(projectReleasePath, bundleFile) {
	let indexTemplate = await fs.readFile('index.html', 'utf-8');
	let indexContent = indexTemplate.replace('debug/index.js', path.relative(projectReleasePath, bundleFile));

	await fs.writeFile(path.join(projectReleasePath, 'index.html'), indexContent);
}

async function copyFiles(projectReleasePath) {
	await fs.copyFile('index.html', path.join(projectReleasePath, 'index.html'));
}
