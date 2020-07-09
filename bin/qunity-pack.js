/**
 * Created by rockyl on 2020-03-17.
 */

const program = require('commander');
const {pack, exit} = require("../dist");

program
	.option('-r, --releaseVersion [string]', 'release version')
	.option('--prod', 'production mode', true)
	.allowUnknownOption(true)
	.parse(process.argv);

(async function () {
	pack({
		releaseVersion: program.releaseVersion,
		prod: program.prod,
	});
})().catch(e => {
	exit(e);
});
