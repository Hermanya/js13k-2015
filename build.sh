#!/bin/bash
tmp="runner"
bin="node_modules/.bin"
mkdir $tmp
$bin/cleancss index.css > $tmp/index.css
$bin/uglifyjs -c --screw-ie8  index.js | $bin/uglifyjs -m > $tmp/index.js
$bin/html-minifier --collapse-whitespace index.html > $tmp/index.html
zip -rq $tmp.zip $tmp
rm -r $tmp
ls -hl | grep .zip
