var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var async = require('async');
var handlebars = require('handlebars');
var im = require('imagemagick');
var walker = require('filewalker');


module.exports = main;

function main(o) {
    if(!o.templates) return console.error('Missing template directory');
    if(!o.input) return console.error('Missing input');
    if(!o.output) return console.error('Missing output');

    var albumPath = path.join(o.templates, 'album.html');
    var photoPath = path.join(o.templates, 'photo.html');
    var config = extend({
        size: {
            width: 100,
            height: 100
        },
        thumbnailPath: 'thumbnails'
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    if(!fs.existsSync(albumPath)) return console.error('Template directory is missing album.html');
    if(!fs.existsSync(photoPath)) return console.error('Template directory is missing photo.html');

    getPaths(o.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths, o, albumPath, photoPath);
    });
}

function getPaths(root, cb) {
    var paths = [];

    walker(root).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        paths.push(p);
    }).on('done', function() {
        cb(null, paths);
    }).walk();
}


function operate(config, paths, o, albumPath, photoPath) {
    var thumbnailRoot = path.join(o.output, config.thumbnailPath);

    mkdir(o.output);
    mkdir(thumbnailRoot);

    var albumTemplate = handlebars.compile(fs.readFileSync(albumPath, 'utf-8'));
    var photoTemplate = handlebars.compile(fs.readFileSync(photoPath, 'utf-8'));

    async.map(paths, iterator, finish);

    function iterator(p, cb) {
        var ip = path.join(o.input, p);
        var op = path.join(o.output, p).replace(path.extname(p), '.html');

        im.identify(ip, function(err, features) {
            if(err) return cb(); // not all files are images

            var parts = p.split(path.sep);
            var album = parts[0];
            var photo = parts[1];

            var thumbnailName = 'thumbnail_' + photo;
            var albumPath = mkdir(path.join(thumbnailRoot, album));
            var outPath = path.join(albumPath, thumbnailName);
            resize(ip, outPath, config.size, function(err) {
                if(err) {
                    console.error(err);
                    return cb();
                }

                var data = photoTemplate(extend(config, {
                    photo: {
                        src: '/' + path.join('images', p),
                        width: features.width,
                        height: features.height
                    }
                }));

                mkdir(path.dirname(op));
                fs.writeFile(op, data, function(err) {
                    if(err) console.error(err);

                    cb(null, path.join(album, thumbnailName));
                });
            });
        });
    }

    function finish(err, thumbnails) {
        if(err) return console.error(err);

        parseAlbums(o.output, config.thumbnailPath, thumbnails, function(err, albums) {
            if(err) return console.error(err);

            writeAlbums(albums);
            writeIndex(albums);
        });
    }

    function writeAlbums(albums) {
        for(var album in albums) {
            var p = path.join(o.output, album);
            var ctx = extend(config, {});
            ctx.photos = albums[album];

            var data = albumTemplate(ctx);
            var op = path.join(p, 'index.html');

            fs.writeFile(op, data, logError);
        }
    }

    function writeIndex(albums) {
        // TODO
    }
}

function parseAlbums(outputRoot, root, thumbnails, cb) {
    var albums = {};

    async.each(thumbnails.filter(id), iterator, finish);

    function iterator(thumbnail, cb) {
        var parts = thumbnail.split('/');

        // XXX: no support for recursive albums yet
        var album = parts[0];
        var photo = parts[1];

        if(!(album in albums)) albums[album] = [];

        im.identify(path.join(outputRoot, root, thumbnail), function(err, features) {
            if(err) return cb();

            albums[album].push({
                src: '/' + path.join(root, thumbnail),
                width: features.width,
                height: features.height
            });

            cb();
        });
    }

    function finish() {
        cb(null, albums);
    }
}

function id(a) {
    return a;
}

function mkdir(p) {
    if(!fs.existsSync(p)) fs.mkdirSync(p);

    return p;
}

function logError(err) {
    if(err) return console.error(err);
}

function resize(inPath, outPath, size, cb) {
    im.convert([inPath, '-resize', size.width + 'x' + size.height, outPath], cb);
}
