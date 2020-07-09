#!/usr/bin/env node

const program = require('commander');

program
	.version('1.0.0')
	.description('qunity command line interface')
	.command('init [tpl]', 'Initialize a project with template').alias('i')
	.command('meta', 'Generate or clean meta files').alias('m')
	.command('compile', 'Compile project').alias('c')
	.command('pack', 'Pack project').alias('p')
	.command('serve', 'Http server').alias('s')
	.command('dev', 'Dev mode. launch meta serve/compile serve/http serve').alias('d')
	.parse(process.argv);
