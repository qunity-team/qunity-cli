/**
 * Created by rockyl on 2020-03-17.
 */

import * as path from 'path'
import * as fs from 'fs-extra'
import * as chalk from 'chalk'
import serveHandler from 'serve-handler'
import * as http from 'http'
import * as https from 'https'

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

export function startHttpServe(options) {
	console.log(chalk.green('launching...'));
	return new Promise((resolve, reject) => {
		const {port, host, folder, keyFile, certFile} = options;

		publicPath = path.resolve(folder);
		if (fs.existsSync(publicPath)) {
			let sslOpts;
			if (keyFile && certFile) {
				const keyContent = fs.readFileSync(keyFile, 'utf8'),
					certContent = fs.readFileSync(certFile, 'utf8');

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
			reject('Public path is not exist: ' + publicPath)
		}
	})
}
