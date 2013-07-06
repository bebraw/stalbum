#!/bin/bash
../bin/stalbum -c config.json -i images -o out -t templates
cp templates/stylesheets out
