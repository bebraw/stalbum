var path = require('path');
var cpuAmount = require('os').cpus().length;

var async = require('async');
var workerFarm = require('worker-farm');
var workers = workerFarm(require.resolve('./thumbnails_worker'));

var im = require('./im');
var utils = require('./utils');


function create(config, paths, cb) {
    var root = path.join(config.output.path, config.thumbnail.path);

    // TODO: remove only thumbnails that don't have a parent in images/
    // TODO: regenerate only thumbnails that have changed (pass last change date here)
    utils.rmdir(root, function(err) {
        utils.mkdir(root, function(err) {
            async.mapLimit(paths, cpuAmount, function(d, cb) {
                workers(root, config, d.data, cb);
            }, function(err, data) {
                workerFarm.end(workers);

                cb(err, data);
            });
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
                path: path.join(config.output.path, thumbnailSrc),
                src: thumbnailSrc,
                album: album,
                photo: photo
            }
        });
    }, utils.convertToSortedList('thumbnails', cb));
}
exports.createStructure = createStructure;
