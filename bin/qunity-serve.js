/**
 * Created by rockyl on 2020-03-17.
 */

const program = require('commander');
const {exit, startHttpServe} = require("../dist");

program
	.option('-h, --host [string]', 'server host', 'localhost')
	.option('-p, --port [number]', 'server port', 3001)
	.option('-f, --folder [string]', 'folder of static files', './')
	.option('-k, --key-file [string]', 'ssl key file')
	.option('-c, --cert-file [string]', 'ssl cert file')
	.allowUnknownOption(true)
	.parse(process.argv);

async function execute() {
	startHttpServe({
		host: program.host,
		port: program.port,
		folder: program.folder,
		keyFile: program.keyFile,
		certFile: program.certFile,
	})
}

execute().catch(e => {
	exit(e);
});
