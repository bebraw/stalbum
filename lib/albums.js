var async = require('async');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var im = require('./im');
var utils = require('./utils');


function initializeDirectories(config, albums, cb) {
    var root = path.join(config.output, config.album.path);

    // TODO: remove only albums that don't exist in images/
    utils.rmdir(root, function(err) {
        utils.mkdir(root, function(err) {
            async.each(albums, function(album, cb) {
                utils.mkdir(path.join(root, album.name), cb);
            }, cb);
        });
    });
}
exports.initializeDirectories = initializeDirectories;

function parse(config, thumbnails, cb) {
    var albums = [];
    var albumIndices = {};

    async.each(thumbnails.filter(utils.id), iterator, finish);

    var srcPrefix = config.album.path && '../';
    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;
        var i = albums.length;

        if(album in albumIndices) i = albumIndices[album];
        else {
            albumIndices[album] = albums.length;
            albums.push({
                name: album,
                href: config.album.path + '/' + album,
                photos: []
            });
        }

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[i].photos.push({
                href: '../' + album + '/' + utils.stripExt(photo) + '.html',
                src: srcPrefix + '../' + thumbnail.src,
                name: 'thumbnail_' + photo,
                width: features.width,
                height: features.height
            });

            cb();
        });
    }

    function finish() {
        albums.sort(function(a, b) {
            return a.name > b.name;
        });

        cb(null, albums);
    }
}
exports.parse = parse;

function write(config, tpl, albums) {
    var albumPrefix = config.album.path && '../';

    async.each(albums, function(album, cb) {
        var p = path.join(config.output, config.album.path, album.name, 'index.html');
        var ctx = extend(config, {});
        ctx.photos = album.photos;
        ctx.prefix = albumPrefix + '..';
        var data = tpl(ctx);

        fs.writeFile(p, data, cb);
    });
}
exports.write = write;
