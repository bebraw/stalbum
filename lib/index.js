var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var async = require('async');

var _albums = require('./albums');
var _index = require('./_index');
var _photos = require('./photos');
var templates = require('./templates');
var thumbnails = require('./thumbnails');
var paths = require('./paths');
var utils = require('./utils');


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
        }
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
        async.map([
            thumbnails.create,
            _photos.createStructure,
            thumbnails.createStructure
            ], function(executable, cb) {
                executable(config, inputPaths, cb);
            },function(err, results) {
                results = utils.toObject(results, 'type', 'data');

                var thumbnails = results.thumbnails.filter(utils.id);
                _albums.parse(config, thumbnails, function(err, albums) {
                    if(err) return console.error(err);

                    _index.write(config, tpls.index, albums);

                    _albums.initializeDirectories(config, albums, function(err) {
                        if(err) return console.error(err);

                        var photos = utils.attachAdjacency(results.photos.filter(utils.id), 'href');
                        _photos.write(config, tpls.photo, photos);

                        _albums.write(config, tpls.album, albums);
                    });
                });
            }
        );
    });
}
