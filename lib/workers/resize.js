var path = require('path');

var im = require('../im');
var utils = require('../utils');


module.exports = function(output, photoName) {
    photoName = photoName || utils.id;

    return function(root, config, p, cb) {
        var parts = p.split(path.sep);
        var album = parts[0];
        var photo = parts[1];

        var inputPath = path.join(config.input, p);
        var albumPath = path.join(root, utils.idfy(album));
        var photoPath = path.join(albumPath, photoName(photo));

        utils.mkdir(albumPath, function() {
            im.resize(inputPath, photoPath, config[output], cb);
        });
    };
};
