var gm = require('gm');


function resize(inPath, outPath, size, cb) {
    gm(inPath).resize(size.width, size.height).write(outPath, function(err) {
        if(err) return cb(err);

        cb();
    });
}
exports.resize = resize;

function identify(inPath, cb) {
    gm(inPath).identify(cb);
}
exports.identify = identify;
