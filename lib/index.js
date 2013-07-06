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
        templates: o.templates,
        input: o.input,
        output: o.output,
        thumbnail: {
            width: 100, // maximum
            height: 100, // maximum
            path: 'thumbnails'
        }
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    paths(config.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths);
    });
}

function operate(config, paths) {
    if(!config.output) return console.error('Missing output');

    var tpls = templates(config.templates, ['index', 'album', 'photo']);

    if(!tpls) return;

    utils.mkdir(config.output);
    utils.mkdir(path.join(config.output, config.thumbnail.path));

    async.each(utils.enumerate(paths), iterator, finish);

    var photos = [];
    var thumbnails = [];

    function iterator(d, cb) {
        var p = d.data;
        var i = d.i;
        var ip = path.join(config.input, p);

        im.identify(ip, function(err, features) {
            if(err) return cb(); // not all files are images

            var parts = p.split(path.sep);
            var album = parts[0];
            var photo = parts[1];

            var albumPath = path.join(config.thumbnail.path, album);
            utils.mkdir(path.join(config.output, albumPath));

            var thumbnailName = 'thumbnail_' + photo;
            var thumbnailSrc = path.join(albumPath, thumbnailName);
            var thumbnailPath = path.join(config.output, thumbnailSrc);

            var href = p.replace(path.extname(p), '.html');
            photos[i] = {
                path: path.join(config.output, href),
                href: '/' + href,
                src: '/' + path.join('images', p),
                width: features.width,
                height: features.height,
                properties: features.properties,
                profiles: features.profiles,
                filesize: features.filesize,
                gamma: features.gamma
            };

            thumbnails[i] = {
                path: thumbnailPath,
                src: thumbnailSrc,
                album: album,
                photo: photo
            };

            im.resize(ip, thumbnailPath, config.thumbnail, function(err) {
                if(err) console.error(err);

                cb();
            });
        });
    }

    function finish(err, data) {
        if(err) return console.error(err);

        photos = utils.attachAdjacency(photos.filter(utils.id), 'href');

        _photos.write(config, tpls.photo, photos);

        _albums.parse(config.output, config.thumbnail.path, thumbnails, function(err, albums) {
            if(err) return console.error(err);

            _albums.write(config, tpls.album, albums);
            _index.write(config, tpls.index, albums);
        });
    }
}
