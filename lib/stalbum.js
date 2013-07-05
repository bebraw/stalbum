var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var async = require('async');
var handlebars = require('handlebars');
var im = require('imagemagick');
var walker = require('filewalker');


module.exports = function(o) {
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

    var albumTemplate = handlebars.compile(fs.readFileSync(albumPath, 'utf-8'));
    var photoTemplate = handlebars.compile(fs.readFileSync(photoPath, 'utf-8'));

    if(!fs.existsSync(o.output)) fs.mkdirSync(o.output);

    var thumbnailRoot = path.join(o.output, config.thumbnailPath);

    if(!fs.existsSync(thumbnailRoot)) fs.mkdirSync(thumbnailRoot);

    var paths = [];
    walker(o.input).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        paths.push(p);
    }).on('done', function() {
        operate(config, thumbnailRoot, paths, o, albumTemplate, photoTemplate);
    }).walk();
};

function operate(config, thumbnailRoot, paths, o, albumTemplate, photoTemplate) {
    var albums = {};

    async.each(paths, iterator, finish);

    function iterator(p, cb) {
        var ip = path.join(o.input, p);
        var op = path.join(o.output, p).replace(path.extname(p), '.html');

        im.identify(ip, function(err, features) {
            if(err) {
                //console.error(p, err);
                return cb();
            }

            // XXX: expects a flat hierarchy
            var parts = p.split(path.sep);
            var album = parts[0];
            var photo = parts[1];

            var atPath = path.join(thumbnailRoot, album);

            if(!fs.existsSync(atPath)) fs.mkdirSync(atPath);

            var thumbnailPath = path.join(atPath, 'thumbnail_' + photo);
            resize(ip, thumbnailPath, config.size.width + 'x' + config.size.height, function(err) {
                if(err) {
                    console.error(err);
                    return cb();
                }

                if(!(album in albums)) albums[album] = [];

                // TODO: identify output to get the right width/height
                albums[album].push({
                    src: '/' + path.join(config.thumbnailPath, album,
                                         'thumbnail_' + photo),
                    width: '', //config.size.width,
                    height: '' //config.size.height
                });

                var data = photoTemplate(extend(config, {
                    photo: {
                        src: '/' + path.join('images', p),
                        width: features.width,
                        height: features.height
                    }
                }));

                var dirname = path.dirname(op);
                if(!fs.existsSync(dirname)) fs.mkdirSync(dirname);

                fs.writeFile(op, data, function(err) {
                    if(err) console.error(err);

                    cb();
                });
            });
        });
    }

    function finish(err) {
        if(err) return console.error(err);

        for(var album in albums) {
            var p = path.join(o.output, album);
            var ctx = extend(config, {});
            ctx.photos = albums[album];

            var data = albumTemplate(ctx);
            var op = path.join(p, 'index.html');

            fs.writeFile(op, data, logError);
        }

        // TODO: generate index that links to albums
    }
}

function logError(err) {
    if(err) return console.error(err);
}

function resize(inPath, outPath, size, cb) {
    im.convert([inPath, '-resize', size, outPath], cb);
}
