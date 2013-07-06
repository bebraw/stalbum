#!/bin/bash
../bin/stalbum -c config.json -i images -o out -t templates
cp -r templates/stylesheets out
cp -r templates/js out
