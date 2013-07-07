var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var utils = require('./utils');


function write(config, tpl, albums) {
    var p = path.join(config.output, 'index.html');
    var ctx = extend(config, {});

    // XXX: eliminate ../../ from album photos. maybe there's a neater way
    ctx.albums = albums.map(function(album) {
        var ret = extend({}, album);

        ret.photos = ret.photos.map(function(photo) {
            var ret = extend({}, photo);

            ret.src = config.thumbnail.path + '/' + album.name + '/' + photo.name;

            return ret;
        });

        return ret;
    });

    var data = tpl(ctx);

    fs.writeFile(p, data, utils.logError);
}
exports.write = write;
