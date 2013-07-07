var path = require('path');

var async = require('async');

var im = require('./im');
var utils = require('./utils');


function create(config, paths, cb) {
    var root = path.join(config.output, config.thumbnail.path);

    utils.rmdir(root, function(err) {
        utils.mkdir(root, function(err) {
            async.map(paths, function(d, cb) {
                var p = d.data;
                var parts = p.split(path.sep);
                var album = parts[0];
                var photo = parts[1];

                var inputPath = path.join(config.input, p);
                var thumbnailAlbumPath = path.join(root, album);
                var thumbnailPath = path.join(thumbnailAlbumPath, 'thumbnail_' + photo);

                utils.mkdir(thumbnailAlbumPath, function() {
                    im.resize(inputPath, thumbnailPath, config.thumbnail, function(err) {
                        if(err) console.error(err);

                        cb();
                    });
                });
            }, cb);
        });
    });
}
exports.create = create;

function createStructure(config, paths, cb) {
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
    }, utils.convertToSortedList('thumbnails', cb));
}
exports.createStructure = createStructure;
