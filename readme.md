# Qunit-cli
cli tool for [qunity](https://github.com/qunity-team/qunity) project

## create
```
Usage: qunity create [options]

Options:
  -t, --template [string]  template on github (default: "qunity-team/sample-blank")
  -p, --name [string]      project name (default: "sample")
  -f, --force              Delete the old project
  -h, --help               display help for command
```
create project from template

## compile
```
Usage: qunity compile [options]

Options:
  -w, --watch  watch filesystem (default: false)
  --prod       production mode (default: false)
  -h, --help   display help for command
```
compile project

## meta
```
Usage: qunity meta [options]

Options:
  -d, --do [string]  g(generate) or c(clear) (default: "g")
  -w, --watch        watch filesystem (only generate mode) (default: false)
  -h, --help         display help for command
```
generate or clear .meta file in assets folder

## serve
```
Usage: qunity serve [options]

Options:
  -h, --host [string]       server host (default: "localhost")
  -p, --port [number]       server port (default: 3001)
  -f, --folder [string]     folder of static files (default: "./")
  -k, --key-file [string]   ssl key file
  -c, --cert-file [string]  ssl cert file
  -h, --help                display help for command
```
start a http-server for project

## dev
```
Usage: qunity dev [options]

Options merge from [compile, meta, serve] commands
```
start compile/meta/serve sub commands

## pack
```
Usage: qunity-pack [options]

Options:
  -r, --releaseVersion [string]  release version
  --prod                         production mode (default: true)
  -h, --help                     display help for command
```
pack project

## todo
- [x] Sub command create
