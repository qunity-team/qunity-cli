/**
 * Created by rockyl on 2018/11/16.
 */

const progress = require('rollup-plugin-progress');
const {uglify} = require('rollup-plugin-uglify');

const options = {
	input: 'src/index.js',
	output: [
		{
			file: `dist/index.js`,
			format: 'cjs',
			sourcemap: true,
		}
	],
	plugins: [
		progress(),
	],
};

if(process.env.BUILD === 'production'){
	options.plugins.push(uglify({}));
}

export default options;
