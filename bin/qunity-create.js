/**
 * Created by rockyl on 2020-03-17.
 */

const program = require('commander');
const {create, exit} = require("../dist");

program
	.option('-t, --template [string]', 'template on github', 'qunity-team/sample-blank')
	.option('-n, --name [string]', 'project name', 'sample')
	.option('-f, --force', 'Delete the old project')
	.allowUnknownOption(true)
	.parse(process.argv);

(async function () {
	create(program);
})().catch(e => {
	exit(e);
});
