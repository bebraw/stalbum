var async = require('async');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var im = require('./im');
var utils = require('./utils');


function parse(outputRoot, root, thumbnails, cb) {
    var albums = {};

    async.each(thumbnails.filter(utils.id), iterator, finish);

    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;

        if(!(album in albums)) albums[album] = [];

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[album].push({
                src: '/' + thumbnail.src,
                href: '/' + album + '/' + utils.stripExt(photo) + '.html',
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

function write(config, output, tpl, albums) {
    for(var album in albums) {
        var p = path.join(output, album, 'index.html');
        var ctx = extend(config, {});
        ctx.photos = albums[album];
        var data = tpl(ctx);

        fs.writeFile(p, data, utils.logError);
    }
}
exports.write = write;
