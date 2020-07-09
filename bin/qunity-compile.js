/**
 * Created by rockyl on 2020-03-17.
 */

const fs = require('fs');
const program = require('commander');
const {compile, exit} = require("../dist");

program
	.option('-w, --watch', 'watch filesystem', false)
	.option('--prod', 'production mode', false)
	.allowUnknownOption(true)
	.parse(process.argv);

(async function () {
	if(!fs.existsSync('manifest.json')){
		exit(`file [manifest.json] not exists`, 1);
	}
	let manifest = JSON.parse(fs.readFileSync('manifest.json'));

	compile({
		prod: program.prod,
		manifest,
	}, program.watch);
})().catch(e => {
	exit(e);
});
