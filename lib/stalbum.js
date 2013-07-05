var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var handlebars = require('handlebars');
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

        var ip = '/' + path.join(o.output, 'images', p);
        var pp = path.join(o.output, p).replace(path.extname(p), '.html');

        var data = photoTemplate(extend(config, {
            photo: {
                src: ip,
                width: 100, // TODO
                height: 100 // TODO
            }
        }));

        var dirname = path.dirname(pp);
        if(!fs.existsSync(dirname)) fs.mkdirSync(dirname);

        fs.writeFile(pp, data, function(err) {
            if(err) return console.error(err);
        });
    }).on('done', function() {
        // TODO: write albums now
    }).walk();
};
