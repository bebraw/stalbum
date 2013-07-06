var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var async = require('async');
var handlebars = require('handlebars');
var im = require('imagemagick');
var walker = require('filewalker');


module.exports = main;

function main(o) {
    var config = extend({
        size: {
            width: 100,
            height: 100
        },
        thumbnailPath: 'thumbnails'
    }, o.config? require(path.join(process.cwd(), o.config)): {});

    getPaths(o.input, function(err, paths) {
        if(err) return console.error(err);

        operate(config, paths, o);
    });
}

function getPaths(root, cb) {
    var paths = [];

    if(!root) return console.error('Missing input');

    walker(root).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        paths.push(p);
    }).on('done', function() {
        cb(null, paths);
    }).walk();
}


function operate(config, paths, o) {
    if(!o.output) return console.error('Missing output');

    var templates = getTemplates(o.templates, ['index', 'album', 'photo']);

    if(!templates) return;

    mkdir(path.join(o.output, config.thumbnailPath));
    mkdir(o.output);

    async.each(paths, iterator, finish);

    var photos = [];
    var thumbnails = [];

    function iterator(p, cb) {
        var ip = path.join(o.input, p);

        im.identify(ip, function(err, features) {
            if(err) return cb(); // not all files are images

            var parts = p.split(path.sep);
            var album = parts[0];
            var photo = parts[1];

            var albumPath = path.join(config.thumbnailPath, album);
            mkdir(path.join(o.output, albumPath));

            var thumbnailName = 'thumbnail_' + photo;
            var thumbnailSrc = path.join(albumPath, thumbnailName);
            var thumbnailPath = path.join(o.output, thumbnailSrc);

            var href = p.replace(path.extname(p), '.html');
            photos.push({
                path: path.join(o.output, href),
                href: '/' + href,
                src: '/' + path.join('images', p),
                width: features.width,
                height: features.height
            });

            thumbnails.push({
                path: thumbnailPath,
                src: thumbnailSrc,
                album: album,
                photo: photo
            });

            resize(ip, thumbnailPath, config.size, function(err) {
                if(err) console.error(err);

                cb();
            });
        });
    }

    function finish(err, data) {
        if(err) return console.error(err);

        writePhotos(attachAdjacency(photos, 'href'));

        parseAlbums(o.output, config.thumbnailPath, thumbnails, function(err, albums) {
            if(err) return console.error(err);

            writeAlbums(albums);
            writeIndex(albums);
        });
    }

    function writePhotos(photos) {
        photos.forEach(function(photo) {
            var ctx = extend(config, {});
            ctx.photo = photo;
            var data = templates.photo(ctx);

            mkdir(path.dirname(photo.path));
            fs.writeFile(photo.path, data, logError);
        });
    }

    function writeAlbums(albums) {
        for(var album in albums) {
            var p = path.join(o.output, album, 'index.html');
            var ctx = extend(config, {});
            ctx.photos = albums[album];
            var data = templates.album(ctx);

            fs.writeFile(p, data, logError);
        }
    }

    function writeIndex(albums) {
        var p = path.join(o.output, 'index.html');
        var ctx = extend(config, {});
        ctx.albums = albums;
        var data = templates.index(ctx);

        fs.writeFile(p, data, logError);
    }
}

function getTemplates(root, templates) {
    if(!templates) return console.error('Missing template directory');

    var ret = {};
    var templatesFound = 0;

    templates.forEach(function(template) {
        var name = template + '.html';
        var p = path.join(root, name);

        if(fs.existsSync(p)) {
            ret[template] = handlebars.compile(fs.readFileSync(p, 'utf-8'));

            templatesFound++;
        }
        else console.error('Template directory is missing ' + name);
    });

    return templatesFound == templates.length && ret;
}

function attachAdjacency(data, prop) {
    var len = data.length;

    return data.map(function(d, i) {
        d.previous = i === 0? data[len - 1][prop]: data[i - 1][prop];
        d.next = i === len - 1? data[0][prop]: data[i + 1][prop];

        return d;
    });
}

function parseAlbums(outputRoot, root, thumbnails, cb) {
    var albums = {};

    async.each(thumbnails.filter(id), iterator, finish);

    function iterator(thumbnail, cb) {
        var album = thumbnail.album;
        var photo = thumbnail.photo;

        if(!(album in albums)) albums[album] = [];

        im.identify(thumbnail.path, function(err, features) {
            if(err) return cb();

            albums[album].push({
                src: '/' + thumbnail.src,
                href: '/' + album + '/' + stripExt(photo) + '.html',
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

function stripExt(p) {
    return path.basename(p, path.extname(p));
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
