var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var async = require('async');

var _albums = require('./albums');
var _index = require('./_index');
var _photos = require('./photos');
var templates = require('./templates');
var paths = require('./paths');
var utils = require('./utils');
var im = require('./im');


module.exports = main;

function main(o) {
    var config = extend({
        size: {
            width: 100,
            height: 100
        },
        thumbnailPath: 'thumbnails'
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    paths(o.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths, o);
    });
}

function operate(config, paths, o) {
    if(!o.output) return console.error('Missing output');

    var tpls = templates(o.templates, ['index', 'album', 'photo']);

    if(!tpls) return;

    utils.mkdir(path.join(o.output, config.thumbnailPath));
    utils.mkdir(o.output);

    async.each(paths, iterator, finish);

    var photos = [];
    var thumbnails = [];

    function iterator(p, cb) {
        var ip = path.join(o.input, p);

        im.identify(ip, function(err, features) {
            if(err) return cb(); // not all files are images

            var parts = p.split(path.sep);
            var album = parts[0];
            var photo = parts[1];

            var albumPath = path.join(config.thumbnailPath, album);
            utils.mkdir(path.join(o.output, albumPath));

            var thumbnailName = 'thumbnail_' + photo;
            var thumbnailSrc = path.join(albumPath, thumbnailName);
            var thumbnailPath = path.join(o.output, thumbnailSrc);

            var href = p.replace(path.extname(p), '.html');
            photos.push({
                path: path.join(o.output, href),
                href: '/' + href,
                src: '/' + path.join('images', p),
                width: features.width,
                height: features.height
            });

            thumbnails.push({
                path: thumbnailPath,
                src: thumbnailSrc,
                album: album,
                photo: photo
            });

            im.resize(ip, thumbnailPath, config.size, function(err) {
                if(err) console.error(err);

                cb();
            });
        });
    }

    function finish(err, data) {
        if(err) return console.error(err);

        _photos.write(config, tpls.photo, utils.attachAdjacency(photos, 'href'));

        _albums.parse(o.output, config.thumbnailPath, thumbnails, function(err, albums) {
            if(err) return console.error(err);

            _albums.write(config, o.output, tpls.album, albums);
            _index.write(config, o.output, tpls.index, albums);
        });
    }
}
