var fs = require('fs');
var path = require('path');

var walker = require('filewalker');


module.exports = function(root, cb) {

    if(!root) return cb('Missing input');

    fs.exists(root, function(exists) {
        if(exists) walk(root, cb);
        else cb('Missing input directory');
    });
};

function walk(root, cb) {
    var paths = [];

    walker(root).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        paths.push(p);
    }).on('done', function() {
        cb(null, paths);
    }).walk();
}
