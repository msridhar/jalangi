var normalizer = require("JS_WALA/normalizer/lib/normalizer.js");
var acorn = require("acorn");
var escodegen = require("escodegen");
var fs = require("fs");

var file = process.argv[2];

console.log(escodegen.generate(normalizer.normalize(acorn.parse(fs.readFileSync(file)+""))));