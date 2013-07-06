var fs = require('fs');
var path = require('path');


function attachAdjacency(data, prop) {
    var len = data.length;

    return data.map(function(d, i) {
        d.previous = i === 0? data[len - 1][prop]: data[i - 1][prop];
        d.next = i === len - 1? data[0][prop]: data[i + 1][prop];

        return d;
    });
}
exports.attachAdjacency = attachAdjacency;

function stripExt(p) {
    return path.basename(p, path.extname(p));
}
exports.stripExt = stripExt;

function id(a) {
    return a;
}
exports.id = id;

function mkdir(p) {
    if(!fs.existsSync(p)) fs.mkdirSync(p);

    return p;
}
exports.mkdir = mkdir;

function logError(err) {
    if(err) return console.error(err);
}
exports.logError = logError;
