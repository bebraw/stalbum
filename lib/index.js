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
        },
        album: {
            path: 'albums'
        },
        prefix: ''
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    paths(config.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths);
    });
}

function operate(config, inputPaths) {
    if(!config.output) return console.error('Missing output');

    var tpls = templates(config.templates, ['index', 'album', 'photo']);

    if(!tpls) return;

    var outputPaths = [
        config.output,
        path.join(config.output, config.album.path),
        path.join(config.output, config.thumbnail.path)
    ];

    inputPaths = utils.enumerate(inputPaths);

    async.eachSeries(outputPaths, utils.mkdir, function() {
        createAlbumPaths(config, inputPaths, function() {
            async.map([
                createThumbnails,
                createPhotosStructure,
                createThumbnailsStructure
                ], function(executable, cb) {
                    executable(config, inputPaths, cb);
                },function(err, results) {
                    results = toObject(results, 'type', 'data');

                    var thumbnails = results.thumbnails.filter(utils.id);
                    var photos = utils.attachAdjacency(results.photos.filter(utils.id), 'href');

                    _photos.write(config, tpls.photo, photos);

                    _albums.parse(config, thumbnails, function(err, albums) {
                        if(err) return console.error(err);

                        _albums.write(config, tpls.album, albums);
                        _index.write(config, tpls.index, albums);
                    });
                }
            );
        });
    });
}

// TODO: to utils
function toObject(arr, k, v) {
    var ret = {};

    arr.forEach(function(o) {
        if(k in o) ret[o[k]] = o[v];
    });

    return ret;
}

function createAlbumPaths(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;

        utils.mkdir(path.join(config.output, p), cb);
    }, cb);
}

function createThumbnails(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;
        var parts = p.split(path.sep);
        var album = parts[0];
        var photo = parts[1];

        var inputPath = path.join(config.input, p);
        var thumbnailAlbumPath = path.join(config.output, config.thumbnail.path, album);
        var thumbnailPath = path.join(thumbnailAlbumPath, 'thumbnail_' + photo);

        utils.mkdir(thumbnailAlbumPath, function() {
            im.resize(inputPath, thumbnailPath, config.thumbnail, function(err) {
                if(err) console.error(err);

                cb();
            });
        });
    }, cb);
}

function createPhotosStructure(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;

        im.identify(path.join(config.input, p), function(err, features) {
            if(err) return cb(); // not all files are images

            var href = p.replace(path.extname(p), '.html');

            cb(null, {
                i: d.i,
                data: {
                    path: path.join(config.output, config.album.path, href),
                    href: config.prefix + '/' + config.album.path + '/' + href,
                    src: config.prefix + '/' + path.join('images', p),
                    width: features.width,
                    height: features.height,
                    properties: features.properties,
                    profiles: features.profiles,
                    filesize: features.filesize,
                    gamma: features.gamma
                }
            });
        });
    }, function(err, d) {
        cb(err, {
            type: 'photos',
            data: toSortedList(d)
        });
    });
}

// TODO: move to utils
function toSortedList(d) {
    var ret = [];

    d.forEach(function(v) {
        ret[v.i] = v.data;
    });

    return ret;
}

// TODO: move finish to utils
function createThumbnailsStructure(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;
        var parts = p.split(path.sep);
        var album = parts[0];
        var photo = parts[1];

        var thumbnailSrc = path.join(config.thumbnail.path, album, 'thumbnail_' + photo);

        cb(null, {
            i: d.i,
            data: {
                path: path.join(config.output, thumbnailSrc),
                src: thumbnailSrc,
                album: album,
                photo: photo
            }
        });
    }, function(err, d) {
        cb(err, {
            type: 'thumbnails',
            data: toSortedList(d)
        });
    });
}
