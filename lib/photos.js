var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var async = require('async');
var workerFarm = require('worker-farm');
var workers = workerFarm(require.resolve('./workers/photos'));

var im = require('./im');
var utils = require('./utils');


function create(config, paths) {
    var root = path.join(config.output.path, config.input);

    // TODO: remove only photos that don't have a parent in images/
    // TODO: regenerate only photos that have changed (pass last change date here)

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

function write(config, tpl, photos, cb) {
    var albumPrefix = config.album.path && '../';

    async.each(photos, function(photo, cb) {
        var ctx = extend(config, {});
        ctx.photo = photo;
        ctx.prefix = albumPrefix + '../..';
        var data = tpl(ctx);

        fs.writeFile(photo.path, data, cb);
    }, cb);
}
exports.write = write;

function createStructure(config, paths, cb) {
    async.map(paths, function(d, cb) {
        var p = d.data;

        im.identify(path.join(config.input, p), function(err, features) {
            if(err) return cb(); // not all files are images

            var album = utils.idfy(path.dirname(p));
            var href = utils.idfy(utils.stripExt(p));
            var ext = path.extname(p);
            var hrefPrefix = config.album.path && config.album.path + '/';
            var srcPrefix = config.album.path && '../';
            var srcPath = path.join(album, href);
            var outDir = path.join(config.output.path, config.album.path, srcPath);

            utils.mkdir(outDir, function(err) {
                cb(err, {
                    i: d.i,
                    data: extend(features, {
                        path: path.join(outDir, 'index.html'),
                        href: '../../../' + hrefPrefix + album + '/' + href,
                        src: srcPrefix + '../../images/' + srcPath + ext,
                        name: p
                    })
                });
            });
        });
    }, utils.convertToSortedList('photos', cb));
}
exports.createStructure = createStructure;
