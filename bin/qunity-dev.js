/**
 * Created by rockyl on 2020-03-17.
 */

const {exit, childProcess} = require("../dist");

const subCommands = [
	'meta',
	'compile',
	'serve',
];

let subProcesses;

(async function () {
	let args = process.argv.slice(2);
	args.push('-w');
	let cwd = process.cwd();
	let ps = subCommands.map(cmd => {
		console.log('start sub command: ' + cmd);
		return childProcess('node', [__dirname + '/qunity-' + cmd + '.js', ...args], cwd);
	});
	subProcesses = await Promise.all(ps);
})().catch(e => {
	exit(e);
});

process.on('exit', destroySubProcesses);
process.on('SIGINT', destroySubProcesses);
process.on('SIGTERM', destroySubProcesses);

function destroySubProcesses() {
	if (subProcesses) {
		for(let subProcess of subProcesses){
			subProcess.kill();
		}
	}
}
