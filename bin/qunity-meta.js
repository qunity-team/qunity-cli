/**
 * Created by rockyl on 2020-03-17.
 */

const program = require('commander');
const {generateMetaFiles, clearMetaFiles, exit} = require("../dist");

program
	.requiredOption('-d, --do [string]', 'g(generate) or c(clear)', 'g')
	.option('-w, --watch', 'watch filesystem (only generate mode)', false)
	.allowUnknownOption(true)
	.parse(process.argv);

(async function () {
	switch (program.do) {
		case 'g':
		case 'generate':
			generateMetaFiles(program.watch);
			break;
		case 'c':
		case 'clear':
			clearMetaFiles();
			break;
	}
})().catch(e => {
	exit(e);
});
