var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var utils = require('./utils');


function write(config, tpl, photos) {
    photos.forEach(function(photo) {
        var ctx = extend(config, {});
        ctx.photo = photo;
        var data = tpl(ctx);

        utils.mkdir(path.dirname(photo.path));
        fs.writeFile(photo.path, data, utils.logError);
    });
}
exports.write = write;
