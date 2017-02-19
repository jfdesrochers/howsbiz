#!/bin/sh

echo "Removing previous App Bundle..."
rm -f ./assets/js/appbundle.min.js
echo "Preparing App Bundle..."
browserify -t [ babelify --presets [ es2015 ] ] -g uglifyify ./assets/js/app.js -o ./assets/js/appbundle.min.js
echo "Running server on port 8080..."
node server.js
echo "Bye."
exit
