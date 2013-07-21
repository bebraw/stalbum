var gm = require('gm');


function resize(inPath, outPath, size, cb) {
    gm(inPath).resize(size.width, size.height).write(outPath, function(err) {
        if(err) return cb(err);

        cb();
    });
}
exports.resize = resize;

function identify(inPath, cb) {
    gm(inPath).identify(function(err, d) {
        if(err) return cb(err);

        cb(null, {
            format: d.format,
            width: d.size.width,
            height: d.size.height,
            depth: d.depth,
            exif: d['Profile-EXIF']
        });
    });
}
exports.identify = identify;
