var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var async = require('async');

var im = require('./im');
var utils = require('./utils');


function write(config, tpl, photos, cb) {
    var albumPrefix = config.album.path && '../';

    async.each(photos, function(photo, cb) {
        var ctx = extend(config, {});
        ctx.photo = photo;
        ctx.prefix = albumPrefix + '..';
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

            var href = p.replace(path.extname(p), '.html');

            var hrefPrefix = config.album.path && config.album.path + '/';
            var srcPrefix = config.album.path && '../';
            cb(null, {
                i: d.i,
                data: {
                    path: path.join(config.output.path, config.album.path, href),
                    href: '../../' + hrefPrefix + href,
                    src: srcPrefix + '../images/' + p,
                    name: p,
                    width: features.width,
                    height: features.height,
                    properties: features.properties,
                    profiles: features.profiles,
                    filesize: features.filesize,
                    gamma: features.gamma
                }
            });
        });
    }, utils.convertToSortedList('photos', cb));
}
exports.createStructure = createStructure;
