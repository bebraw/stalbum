var async = require('async');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var im = require('./im');
var utils = require('./utils');


function parse(config, thumbnails, cb) {
    var albums = {};

    async.each(thumbnails.filter(utils.id), iterator, finish);

    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;

        if(!(album in albums)) albums[album] = {
            name: album,
            href: config.prefix + '/' + config.album.path + '/' + album,
            photos: []
        };

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[album].photos.push({
                src: config.prefix + '/' + thumbnail.src,
                href: config.prefix + '/' + config.album.path + '/' + album +
                    '/' + utils.stripExt(photo) + '.html',
                width: features.width,
                height: features.height
            });

            cb();
        });
    }

    function finish() {
        cb(null, albums);
    }
}
exports.parse = parse;

function write(config, tpl, albums) {
    for(var album in albums) {
        var d = utils.mkdir(path.join(config.output, config.album.path, album));
        var p = path.join(d, 'index.html');
        var ctx = extend(config, {});
        ctx.photos = albums[album].photos;
        var data = tpl(ctx);

        fs.writeFile(p, data, utils.logError);
    }
}
exports.write = write;
