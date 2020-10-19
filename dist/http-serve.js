"use strict";
/**
 * Created by rockyl on 2020-03-17.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const serve_handler_1 = require("serve-handler");
const http = require("http");
const https = require("https");
let publicPath;
function handler(request, response) {
    return serve_handler_1.default(request, response, {
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
        const { port, host, folder, keyFile, certFile } = options;
        publicPath = path.resolve(folder);
        if (fs.existsSync(publicPath)) {
            let sslOpts;
            if (keyFile && certFile) {
                const keyContent = fs.readFileSync(keyFile, 'utf8'), certContent = fs.readFileSync(certFile, 'utf8');
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
        }
        else {
            console.log(chalk.red('Public path is not exist: ' + publicPath));
            reject('Public path is not exist: ' + publicPath);
        }
    });
}
exports.startHttpServe = startHttpServe;
//# sourceMappingURL=http-serve.js.map