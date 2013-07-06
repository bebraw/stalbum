var imagemagick = require('imagemagick');

function resize(inPath, outPath, size, cb) {
    imagemagick.convert([inPath, '-resize', size.width + 'x' + size.height, outPath], cb);
}
exports.resize = resize;

exports.identify = imagemagick.identify;
