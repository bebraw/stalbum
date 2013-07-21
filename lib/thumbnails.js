var path = require('path');

var async = require('async');
var workerFarm = require('worker-farm');
var workers = workerFarm(require.resolve('./workers/thumbnails'));

var utils = require('./utils');


function create(config, paths) {
    var root = path.join(config.output.path, config.thumbnail.path);

    // TODO: remove only thumbnails that don't have a parent in images/
    // TODO: regenerate only thumbnails that have changed (pass last change date here)
    return paths.map(function(path) {
        return function(cb) {
            workers(root, config, path.data, cb);
        };
    });
}
exports.create = create;

function finish() {
    workerFarm.end(workers);
}
exports.finish = finish;

function createStructure(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;
        var parts = p.split(path.sep);
        var album = utils.idfy(parts[0]);
        var photo = parts[1];
        var thumbnailSrc = path.join(config.thumbnail.path, album, 'thumbnail_' + photo);
        var outPath = path.join(config.output.path, thumbnailSrc);

        cb(null, {
            i: d.i,
            data: {
                path: outPath,
                src: thumbnailSrc,
                album: album,
                photo: photo
            }
        });
    }, utils.convertToSortedList('thumbnails', cb));
}
exports.createStructure = createStructure;
