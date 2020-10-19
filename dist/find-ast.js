"use strict";
/**
 * Created by rockyl on 2020-05-12.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const esprima_1 = require("esprima");
const crypto_1 = require("crypto");
const caches = {};
function md5(source) {
    const hash = crypto_1.default.createHash('md5');
    return hash.update(source).digest('hex');
}
function getTokens(code, filter) {
    let id = md5(code + filter.toString());
    let tokens;
    if (caches[id]) {
        tokens = caches[id];
    }
    else {
        let tokensTemp = esprima_1.default.tokenize(code);
        if (filter) {
            tokensTemp = tokensTemp.filter(filter);
        }
        tokens = caches[id] = tokensTemp;
    }
    return tokens;
}
exports.getTokens = getTokens;
//# sourceMappingURL=find-ast.js.map