var path = require('path');

var walker = require('filewalker');


module.exports = function(root, cb) {
    var paths = [];

    if(!root) return console.error('Missing input');

    walker(root).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        paths.push(p);
    }).on('done', function() {
        cb(null, paths);
    }).walk();
};
