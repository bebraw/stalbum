var async = require('async');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var im = require('./im');
var utils = require('./utils');


function parse(config, thumbnails, cb) {
    var prefix = config.prefix && '/' + config.prefix;
    var albums = {};

    async.each(thumbnails.filter(utils.id), iterator, finish);

    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;

        if(!(album in albums)) albums[album] = {
            name: album,
            href: prefix + '/' + album,
            photos: []
        };

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[album].photos.push({
                src: prefix + '/' + thumbnail.src,
                href: prefix + '/' + album + '/' + utils.stripExt(photo) + '.html',
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
        var p = path.join(config.output, album, 'index.html');
        var ctx = extend(config, {});
        ctx.photos = albums[album];
        var data = tpl(ctx);

        fs.writeFile(p, data, utils.logError);
    }
}
exports.write = write;
