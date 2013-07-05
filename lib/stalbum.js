var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var handlebars = require('handlebars');
var im = require('imagemagick');
var walker = require('filewalker');


module.exports = function(o) {
    if(!o.templates) return console.error('Missing template directory');
    if(!o.input) return console.error('Missing input');
    if(!o.output) return console.error('Missing output');

    var cwd = process.cwd();
    var albumPath = path.join(o.templates, 'album.html');
    var photoPath = path.join(o.templates, 'photo.html');
    var config = o.config? require(path.join(cwd, o.config)): {};

    if(!fs.existsSync(albumPath)) return console.error('Template directory is missing album.html');
    if(!fs.existsSync(photoPath)) return console.error('Template directory is missing photo.html');

    var albumTemplate = handlebars.compile(fs.readFileSync(albumPath, 'utf-8'));
    var photoTemplate = handlebars.compile(fs.readFileSync(photoPath, 'utf-8'));

    if(!fs.existsSync(o.output)) fs.mkdirSync(o.output);

    walker(o.input).on('file', function(p) {
        if(p[0] == '.') return;
        if(path.basename(p)[0] == '.') return;

        var op = path.join(o.output, p).replace(path.extname(p), '.html');

        im.identify(path.join(o.input, p), function(err, features) {
            if(err) return console.error(p, err);

            var data = photoTemplate(extend(config, {
                photo: {
                    src: '/' + path.join(o.output, 'images', p),
                    width: features.width,
                    height: features.height
                }
            }));

            var dirname = path.dirname(op);
            if(!fs.existsSync(dirname)) fs.mkdirSync(dirname);

            fs.writeFile(op, data, function(err) {
                if(err) return console.error(err);
            });
        });
    }).on('done', function() {
        // TODO: write albums now
    }).walk();
};
