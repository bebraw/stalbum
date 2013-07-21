var fs = require('fs');
var path = require('path');
var extend = require('deep-extend');
var cpuAmount = require('os').cpus().length;

var async = require('async');
var ProgressBar = require('progress');

var _albums = require('./albums');
var _index = require('./_index');
var _photos = require('./photos');
var _templates = require('./templates');
var _thumbnails = require('./thumbnails');
var _paths = require('./paths');
var _utils = require('./utils');


module.exports = main;

function main(o) {
    var config = extend({
        templates: o.templates,
        input: o.input,
        output: {
            width: 1000, // maximum
            height: 1000, // maximum
            path: o.output
        },
        thumbnail: {
            width: 100, // maximum
            height: 100, // maximum
            path: 'thumbnails'
        },
        album: {
            path: 'albums'
        },
        instances: o.instances || cpuAmount
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    _paths(config.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths);
    });
}

function operate(config, inputPaths) {
    if(!config.output) return console.error('Missing output');
    if(!config.output.path) return console.error('Missing output path');

    var tpls = _templates(config.templates, 'master', ['index', 'album', 'photo']);

    if(!tpls) return;

    var outputPaths = [
        config.output.path,
        path.join(config.output.path, config.input),
        path.join(config.output.path, config.album.path),
        path.join(config.output.path, config.thumbnail.path)
    ];
    var startTime = new Date();

    inputPaths = _utils.enumerate(inputPaths);

    async.eachSeries(outputPaths, _utils.mkdir, function() {
        async.map([
                _photos.createStructure,
                _thumbnails.createStructure
            ],
            function(executable, cb) {
                executable(config, inputPaths, cb);
            },
            function(err, results) {
                if(err) return console.error(err);

                results = _utils.toObject(results, 'type', 'data');

                var ops = _thumbnails.create(config, inputPaths).concat(
                    _photos.create(config, inputPaths));

                var bar = new ProgressBar('[:bar] :percent', {
                    complete: '=',
                    incomplete: ' ',
                    width: 20,
                    total: ops.length
                });

                async.mapLimit(ops, config.instances,
                    function(op, cb) {
                        op(function() {
                            bar.tick();

                            cb();
                        });
                    },
                    function() {
                        _thumbnails.finish();
                        _photos.finish();

                        write(config, tpls, results, function(err) {
                            if(err) return console.error(err);

                            var totalTime = new Date() - startTime;

                            console.log('\n\nFinished! Spent ' + totalTime + 'ms');
                        });
                    }
                );
            }
        );
    });
}

function write(config, tpls, results, cb) {
    var thumbnails = results.thumbnails.filter(_utils.id);

    _albums.parse(config, thumbnails, function(err, albums) {
        if(err) return console.error(err);

        _index.write(config, tpls.index, albums);

        var photos = _utils.attachAdjacency(
            results.photos.filter(_utils.id), 'href'
        );

        async.parallel([
            _photos.write.bind(undefined, config, tpls.photo, photos),
            _albums.write.bind(undefined, config, tpls.album, albums)
        ], cb);
    });
}
