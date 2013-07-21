var path = require('path');

var im = require('../im');
var utils = require('../utils');

module.exports = function(root, config, p, cb) {
    var parts = p.split(path.sep);
    var album = parts[0];
    var photo = parts[1];

    var inputPath = path.join(config.input, p);
    var albumPath = path.join(root, utils.idfy(album));
    var thumbnailPath = path.join(albumPath, 'thumbnail_' + photo);

    utils.mkdir(albumPath, function() {
        im.resize(inputPath, thumbnailPath, config.thumbnail, function(err) {
            if(err) console.error(err);

            cb();
        });
    });
};
