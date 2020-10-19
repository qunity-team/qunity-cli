/**
 * Created by rockyl on 2020-05-12.
 */

import esprima from 'esprima';
import crypto from 'crypto'

const caches = {};

function md5(source) {
	const hash = crypto.createHash('md5');
	return hash.update(source).digest('hex');
}

export function getTokens(code, filter) {
	let id = md5(code + filter.toString());
	let tokens;

	if (caches[id]) {
		tokens = caches[id];
	} else {
		let tokensTemp = esprima.tokenize(code);
		if(filter){
			tokensTemp = tokensTemp.filter(filter);
		}
		tokens = caches[id] = tokensTemp;
	}

	return tokens;
}
