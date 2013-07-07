var async = require('async');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var im = require('./im');
var utils = require('./utils');


function createPaths(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;

        utils.mkdir(path.join(config.output, p), cb);
    }, cb);
}
exports.createPaths = createPaths;

function parse(config, thumbnails, cb) {
    var albums = [];
    var albumIndices = {};

    async.each(thumbnails.filter(utils.id), iterator, finish);

    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;
        var i = albums.length;

        if(album in albumIndices) i = albumIndices[album];
        else {
            albumIndices[album] = albums.length;
            albums.push({
                name: album,
                href: config.prefix + '/' + config.album.path + '/' + album,
                photos: []
            });
        }

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[i].photos.push({
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
    async.each(albums, function(album, cb) {
        var p = path.join(config.output, config.album.path, album.name);

        utils.mkdir(p, function(err) {
            if(err) return cb(err);

            p = path.join(p, 'index.html');

            var ctx = extend(config, {});
            ctx.photos = album.photos;
            var data = tpl(ctx);

            fs.writeFile(p, data, cb);
        });
    });
}
exports.write = write;
