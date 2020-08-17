'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path$1 = _interopDefault(require('path'));
var glob$1 = _interopDefault(require('glob'));
var chalk = _interopDefault(require('chalk'));
var fs$2 = _interopDefault(require('fs'));
var uuid = require('uuid');
var chokidar = _interopDefault(require('chokidar'));
var child_process = require('child_process');
var crypto = _interopDefault(require('crypto'));
var serveHandler = _interopDefault(require('serve-handler'));
var http = _interopDefault(require('http'));
var https = _interopDefault(require('https'));
var rollup = _interopDefault(require('rollup'));
var typescript = _interopDefault(require('typescript'));
var rpt = _interopDefault(require('rollup-plugin-typescript'));
var rollupPluginUglify = require('rollup-plugin-uglify');
var resolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var commonjs = _interopDefault(require('@rollup/plugin-commonjs'));
var json = _interopDefault(require('@rollup/plugin-json'));
var chalk$1 = _interopDefault(require('chalk/source'));
var fs$3 = _interopDefault(require('fs-extra'));
var packSheet = _interopDefault(require('sheet-packer'));

/**
 * Created by rockyl on 2018/7/5.
 */

function exit$1(err, code = 1) {
	console.error(err);
	process.exit(code);
}

function childProcess(cmd, params, cwd, printLog = true) {
	let options = {};
	if (cwd) {
		options.cwd = cwd;
	}
	const proc = child_process.spawn(cmd, params, options);

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

function childProcessSync(cmd, params, cwd, printLog = true) {
	return new Promise((resolve, reject) => {
		let proc = childProcess(cmd, params, cwd, printLog);

		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(code);
			}
		});
	});
}

function gitClone(url, path) {
	return childProcessSync('git', ['clone', url, path]);
}

function npmInstall(path) {
	return childProcessSync('npm', ['i'], path);
}

function npmRun(path, scriptName) {
	return childProcessSync('npm', ['run', scriptName], path);
}

function getMd5(fileOrBuffer) {
	let buffer = fileOrBuffer;
	if (typeof fileOrBuffer === 'string') {
		buffer = fs$2.readFileSync(fileOrBuffer);
	}

	let hash = crypto.createHash('md5');
	hash.update(buffer);
	return hash.digest('hex');
}

/**
 * Created by rockyl on 2020-03-18.
 */

const ts = require('typescript');
const fs = require('fs');

const {
	ClassDeclaration, EnumDeclaration, ExportKeyword, DefaultKeyword,
	PropertyDeclaration, MethodDeclaration,
	TypeReference, AnyKeyword, NumberKeyword, StringKeyword, BooleanKeyword,
	NumericLiteral, StringLiteral, TrueKeyword, FalseKeyword,
	PrivateKeyword, ProtectedKeyword, StaticKeyword,
	NewExpression, PropertyAccessExpression, ObjectLiteralExpression, ArrayLiteralExpression,
} = ts.SyntaxKind;

const filterModifiers = [PrivateKeyword, ProtectedKeyword, StaticKeyword,];
const filterDecorators = ['hidden'];
const filterNamePrefix = ['_', '$'];

const typeMapping = {
	[AnyKeyword]: 'any',
	[NumberKeyword]: 'number',
	[StringKeyword]: 'string',
	[BooleanKeyword]: 'boolean',
};

const defaultTypeMapping = {
	[NumericLiteral]: 'number',
	[StringLiteral]: 'string',
	[TrueKeyword]: 'boolean',
	[FalseKeyword]: 'boolean',
};

const editorInstructs = ['if'];

const vector2Properties = ['x', 'y'];

function generateDeclaration(scriptFile) {
	let code = fs.readFileSync(scriptFile, 'utf-8');
	console.time('parse');
	let sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2015);
	console.timeEnd('parse');

	let enums = [];
	let components = [];
	let declaration;
	ts.forEachChild(sourceFile, function (node) {
		switch (node.kind) {
			case ClassDeclaration:
				if (
					node.modifiers && node.modifiers.length >= 2 &&
					node.modifiers[0].kind === ExportKeyword &&
					node.modifiers[1].kind === DefaultKeyword
				) {
					let props = [];
					let methods = [];
					declaration = {
						name: node.name.text,
						props,
						methods,
					};
					putComment(node, declaration);

					let prop;
					for (let member of node.members) {
						let name = member.name.text;
						if (filterMember(member, name)) {
							continue;
						}
						switch (member.kind) {
							case PropertyDeclaration:
								prop = getProp(member);
								putEditorTag(member, prop);
								if (prop.type && prop.type !== 'any') {
									props.push(prop);
								}
								break;
							case MethodDeclaration:
								let method = {
									name,
								};
								putComment(member, method);
								if (member.parameters && member.parameters.length > 0) {
									let parameters = method.parameters = [];
									for (let parameter of member.parameters) {
										let p = getProp(parameter);
										if (parameter.questionToken) {
											p.optional = true;
										}
										parameters.push(p);
									}
								}
								methods.push(method);
								break;
						}
					}

					components.push(declaration);
				}
				break;
			case EnumDeclaration:
				let members = [];
				declaration = {
					name: node.name.text,
					members,
				};
				putComment(node, declaration);

				for (let member of node.members) {
					let item = {
						label: member.name.text,
					};
					let defaultValue = getDefaultValue(member);
					if (defaultValue) {
						item.value = defaultValue.value;
					}
					putComment(member, item);
					members.push(item);
				}

				enums.push(declaration);
				break;
		}

		return null;
	});

	let result = {};
	if (enums.length > 0) {
		result.enums = enums;
	}
	if (components.length > 0) {
		result.components = components;
	}
	return result;
}

function filterMember(node, name) {
	let skip = false;
	for (let prefix of filterNamePrefix) {
		if (name.startsWith(prefix)) {
			skip = true;
			break;
		}
	}
	if (!skip && node.modifiers) {
		for (let modifier of node.modifiers) {
			if (filterModifiers.includes(modifier.kind)) {
				skip = true;
				break;
			}
		}
	}
	if (!skip && node.decorators && node.decorators.length > 0) {
		for (let decorator of node.decorators) {
			if (filterDecorators.includes(decorator.expression.text)) {
				skip = true;
				break;
			}
		}
	}

	return skip;
}

function getType(node) {
	if (node.type) {
		let type = node.type;
		if (type.kind === TypeReference) {
			return type.typeName.text;
		} else {
			return typeMapping[type.kind];
		}
	}
}

function getDefaultValue(node, preType) {
	if (node.initializer) {
		let value, type, init, initializer = node.initializer;
		switch (initializer.kind) {
			case NewExpression:
				switch (preType) {
					case 'Vector2':
						value = [];
						for (let i = 0, li = initializer.arguments.length; i < li; i++) {
							const argument = initializer.arguments[i];
							init = getInitializer(argument);
							value.push(init.value);
						}
						break;
				}
				break;
			case PropertyAccessExpression:
				if (initializer.expression) {
					type = initializer.expression.text;
				}
				value = node.initializer.name.text;
				break;
			case ArrayLiteralExpression: //数组暂时不识别
				//type = 'array';
				break;
			case ObjectLiteralExpression:
				switch (preType) {
					case 'vector2':
						value = {};
						for (let property of initializer.properties) {
							init = getInitializer(property.initializer);
							let field = property.name.escapedText;
							if (vector2Properties.includes(field)) {
								value[field] = init.value;
							}
						}
						break;
				}
				break;
			default:
				init = getInitializer(initializer);
				type = init.type;
				value = init.value;
		}
		let dv = {
			value,
		};
		if (type !== undefined) {
			dv.type = type;
		}
		return dv;
	}
}

function getInitializer(initializer) {
	let value, type = defaultTypeMapping[initializer.kind];
	let text = initializer.text;
	switch (initializer.kind) {
		case NumericLiteral:
			value = parseFloat(text);
			break;
		case StringLiteral:
			value = text;
			break;
		case TrueKeyword:
			value = true;
			break;
		case FalseKeyword:
			value = false;
			break;
	}

	return {type, value};
}

function getComment(node) {
	if (node.jsDoc) {
		let jsDoc = node.jsDoc[node.jsDoc.length - 1];
		return jsDoc.comment;
	}
}

function putComment(node, target) {
	let c = getComment(node);
	if (c) {
		target.comment = c;
	}
}

function putEditorTag(node, target) {
	if (node.jsDoc) {
		let jsDoc = node.jsDoc[node.jsDoc.length - 1];
		if (jsDoc.tags) {
			let instructions = {};
			for (let tag of jsDoc.tags) {
				let tagName = tag.tagName.text;
				if (editorInstructs.includes(tagName)) {
					instructions[tagName] = tag.comment;
				}
			}
			if (Object.keys(instructions).length > 0) {
				target.instructions = instructions;
			}
		}
	}
}

function getProp(node) {
	let name = node.name.text;

	let type = getType(node);
	let defaultValue = getDefaultValue(node, type);
	if (!type) {
		if (defaultValue && defaultValue.hasOwnProperty('type')) {
			type = defaultValue.type;
		} else {
			type = 'any';
		}
	}

	let prop = {
		name,
		type,
	};
	if (defaultValue && defaultValue.hasOwnProperty('value')) {
		prop.default = defaultValue.value;
	}
	putComment(node, prop);
	return prop;
}

/**
 * Created by rockyl on 2020-03-16.
 */

let t;

function generateMetaFiles(watch = false) {
	if (fs$2.existsSync('assets')) {
		if (watch) {
			console.log(chalk.blue('start watch assets folder to generate meta files'));
			chokidar.watch('assets').on('all', (event, path) => {
				//console.log(event, path);
				if (t) {
					clearTimeout(t);
					t = null;
				}
				t = setTimeout(executeOnce, 200);
			});
		} else {
			executeOnce();
			console.log(chalk.cyan('generate meta files successfully'));
		}
	} else {
		exit$1('assets folder not exists', 1);
	}
}

function executeOnce() {
	let files = glob$1.sync('assets/**/!(*.meta)');

	for (let file of files) {
		if (!fs$2.existsSync(file + '.meta')) {
			generateMetaFile(file);
		}
	}

	let tsFiles = glob$1.sync('assets/**/*.ts');
	console.time('generateDeclaration>');
	for (let file of tsFiles) {
		let meta = JSON.parse(fs$2.readFileSync(file + '.meta', 'utf-8'));
		let md5 = getMd5(file);
		if (meta.md5 !== md5) {
			meta.declaration = generateDeclaration(file);
			meta.md5 = md5;

			saveMetaFile(file, meta);
		}
	}
	console.timeEnd('generateDeclaration>');
}

function generateMetaFile(file) {
	let meta = {
		ver: '1.0.1',
		uuid: uuid.v4(),
		extname: path$1.extname(file),
	};

	saveMetaFile(file, meta);

	console.log(chalk.green('generate ' + file + '.meta'));

	return meta;
}

function saveMetaFile(file, meta){
	fs$2.writeFileSync(file + '.meta', JSON.stringify(meta, null, '\t'));
}

/**
 * Created by rockyl on 2020-03-17.
 */

function clearMetaFiles() {
	if (fs$2.existsSync('assets')) {
		executeOnce$1();
		console.log(chalk.cyan('clear meta files successfully'));
	} else {
		exit$1('assets folder not exists', 1);
	}
}

function executeOnce$1() {
	let files = glob$1.sync('assets/**/*.meta');

	for (let file of files) {
		let bodyFile = file.replace('.meta', '');
		if (!fs$2.existsSync(bodyFile)) {
			fs$2.unlinkSync(file);
			console.log(chalk.green('remove ' + file + '.meta'));
		}
	}
}

/**
 * Created by rockyl on 2020-03-17.
 */

let publicPath;

function handler(request, response) {
	return serveHandler(request, response, {
		public: publicPath,
		headers: [
			{
				source: '**/*',
				headers: [
					{
						key: 'Access-Control-Allow-Origin', value: '*',
					}
				]
			}
		]
	});
}

function startHttpServe(options) {
	console.log(chalk.green('launching...'));
	return new Promise((resolve, reject) => {
		const {port, host, folder, keyFile, certFile} = options;

		publicPath = path$1.resolve(folder);
		if (fs$2.existsSync(publicPath)) {
			let sslOpts;
			if (keyFile && certFile) {
				const keyContent = fs$2.readFileSync(keyFile, 'utf8'),
					certContent = fs$2.readFileSync(certFile, 'utf8');

				if (keyContent && certContent) {
					sslOpts = {
						key: keyContent,
						cert: certContent
					};
				}
			}

			const server = sslOpts ? https.createServer(sslOpts, handler) : http.createServer(handler);

			server.on('error', (err) => {
				console.log(chalk.red(err.message));
				reject(err.message);
			});

			server.listen(port, host, function () {
				let isSSL = !!sslOpts;
				const schema = isSSL ? 'https' : 'http';

				console.log(chalk.blue(`${schema} server start at ${schema}://${host}:${port}`));
				console.log(chalk.blue(`${schema} path: ${publicPath}`));

				resolve({
					host, port, publicPath, isSSL,
				});
			});
		} else {
			console.log(chalk.red('Public path is not exist: ' + publicPath));
			reject('Public path is not exist: ' + publicPath);
		}
	})
}

/**
 * Created by rockyl on 2020-03-16.
 */

const fs$1 = require('fs');
const path = require('path');
const glob = require('glob');

const targetId = 'register-scripts';

function getModuleName(file) {
	let metaFile = file + '.meta';
	if(!fs$1.existsSync(metaFile)){
		return;
	}
	let metaContent = JSON.parse(fs$1.readFileSync(metaFile, 'utf-8'));
	let fileContent = fs$1.readFileSync(file, 'utf-8');
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

function dealScriptsDependencies(options) {
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

/**
 * Created by rockyl on 2020-03-18.
 */

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
let t$1;

async function compile(options, watch = false) {
	if (!fs$2.existsSync('src/index.ts')) {
		exit$1(`file [${inputFile}] not exists`, 1);
	}

	if (options) {
		options = Object.assign({}, defaultOptions, options);
	} else {
		options = Object.assign({}, defaultOptions);
	}

	let {name: moduleName, engine: adaptor, externals: manifestExternals} = options.manifest;
	let {prod, outputFile} = options;

	if(!outputFile){
		outputFile = prod ? prodOutputFile : devOutputFile;
	}

	let externals = adaptorExternalMap[adaptor];

	if (!externals) {
		exit$1(`adaptor [${adaptor}] not exists`, 2);
	}

	externals = Object.assign({}, externals, defaultOptions.externals, manifestExternals);

	let inputOptions = {
		input: inputFile,
		plugins: [
			json(),
			dealScriptsDependencies(),
			resolve({
				browser: true,
			}),
			rpt({
				typescript,
				include: ['src/**/*.ts+(|x)', 'assets/**/*.ts+(|x)']
			}),
			commonjs(),
		],
		external: Object.keys(externals),
	};

	if (prod) {
		inputOptions.plugins.push(rollupPluginUglify.uglify({}));
	}

	let outputOptions = {
		file: outputFile,
		format: 'umd',
		name: moduleName,
		sourcemap: !prod,
		globals: externals,
	};

	if (watch) {
		let watchOptions = {
			...inputOptions,
			output: outputOptions,
		};
		const watcher = rollup.watch(watchOptions);

		watcher.on('event', event => {
			switch (event.code) {
				case 'START':
					console.log(chalk$1.cyan('start building...'));
					break;
				case 'END':
					console.log(chalk$1.cyan('build project successfully'));
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
				//console.log(event, path);
				if (t$1) {
					clearTimeout(t$1);
					t$1 = null;
				}
				t$1 = setTimeout(modifyNeedCompile, 500);
			}
		});
	} else {
		try {
			const bundle = await rollup.rollup(inputOptions);

			await bundle.write(outputOptions);
			console.log(chalk$1.cyan('build project successfully'));
		} catch (e) {
			console.warn(e);
			exit$1('build project failed', 1);
		}
	}
}

function modifyNeedCompile() {
	let content = fs$2.readFileSync('src/need-compile.ts');
	fs$2.writeFileSync('src/need-compile.ts', content);
}

/**
 * Created by rockyl on 2020-05-12.
 */

function getDoc(source) {
	function requireMethod(id) {
		if (id === 'qunity') {
			return {
				Doc: function () {
					return {
						kv: function (args) {
							return args;
						}
					}
				}
			}
		}
	}

	let func = new Function('require', 'exports', source);
	let exports = {};
	func(requireMethod, exports);
	return exports.doc;
}

/**
 * Created by rockyl on 2020-05-12.
 *
 * pack project
 */

const releasePath = 'dist';

async function pack(options) {
	if (!fs$3.existsSync('manifest.json')) {
		exit(`file [manifest.json] not exists`, 1);
	}
	let manifest = JSON.parse(fs$3.readFileSync('manifest.json'));

	let releaseVersion = options.releaseVersion || Date.now().toString();
	let projectReleasePath = path$1.join(releasePath, releaseVersion);
	await fs$3.ensureDir(projectReleasePath);

	const bundleFile = await compileBundle(options, manifest, projectReleasePath);

	await packSheets(projectReleasePath);
	await parseIndexHtml(projectReleasePath, bundleFile);
	await copyFiles(projectReleasePath);
}

async function compileBundle(options, manifest, projectReleasePath) {
	let bundleFile = path$1.join(projectReleasePath, 'index.min.js');
	let compileOptions = {
		prod: options.prod,
		outputFile: bundleFile,
		manifest,
	};
	await compile(compileOptions);

	return bundleFile;
}

async function packSheets(projectReleasePath) {
	let assetsPath = 'assets';
	let projectReleaseAssetsPath = path$1.join(projectReleasePath, 'assets');
	await fs$3.ensureDir(projectReleaseAssetsPath);

	let sceneFiles = glob$1.sync(assetsPath + '/**/*.scene');

	for (let sceneFile of sceneFiles) {
		let sceneContent = await fs$3.readFile(sceneFile, 'utf-8');
		let doc = getDoc(sceneContent);
		let assets = doc.assets;
		let files = assets.map(asset => asset.url).filter(asset => asset.endsWith('.png'));
		let {sheets, singles} = await packSheet(files, {});

		//console.log(assets, sheets, singles);
		let sheetIndex = 0;
		for (let {frames, buffer} of sheets) {
			let keys = Object.keys(frames);
			for (let url of keys) {
				let asset = assets.find(asset => asset.url === url);
				if (asset) {
					let relativePath = path$1.relative('assets', url);
					frames[relativePath] = frames[url];
					delete frames[url];

					frames[relativePath].uuid = asset.uuid;
				}
			}
			await fs$3.writeFile(path$1.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.sht'), JSON.stringify(frames));
			await fs$3.writeFile(path$1.join(projectReleaseAssetsPath, 'sheet_' + sheetIndex + '.png'), buffer);
			sheetIndex++;
		}
		for(let single of singles){
			await fs$3.copy(single, path$1.join(projectReleasePath, single));
		}
	}
}

async function parseIndexHtml(projectReleasePath, bundleFile) {
	let indexTemplate = await fs$3.readFile('index.html', 'utf-8');
	let indexContent = indexTemplate.replace('debug/index.js', path$1.relative(projectReleasePath, bundleFile));

	await fs$3.writeFile(path$1.join(projectReleasePath, 'index.html'), indexContent);
}

async function copyFiles(projectReleasePath) {
	await fs$3.copyFile('index.html', path$1.join(projectReleasePath, 'index.html'));
}

exports.childProcess = childProcess;
exports.childProcessSync = childProcessSync;
exports.clearMetaFiles = clearMetaFiles;
exports.compile = compile;
exports.exit = exit$1;
exports.generateMetaFile = generateMetaFile;
exports.generateMetaFiles = generateMetaFiles;
exports.getMd5 = getMd5;
exports.gitClone = gitClone;
exports.npmInstall = npmInstall;
exports.npmRun = npmRun;
exports.pack = pack;
exports.startHttpServe = startHttpServe;
//# sourceMappingURL=index.js.map
