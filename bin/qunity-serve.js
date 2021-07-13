/**
 * Created by rockyl on 2020-03-17.
 */

const program = require('commander');
const {exit, startHttpServe} = require("../dist");

program.option('--host [string]', 'server host', '0.0.0.0')
program.option('-p, --port [number]', 'server port', 3030)
program.option('-f, --folder [string]', 'folder of static files', './')
program.option('-k, --key-file [string]', 'ssl key file')
program.option('-c, --cert-file [string]', 'ssl cert file')
program.allowUnknownOption(true)
program.parse(process.argv);

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
