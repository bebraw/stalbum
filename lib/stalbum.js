var fs = require('fs');
var path = require('path');


module.exports = function(o) {
    if(!o.templates) return console.error('Missing template directory');
    if(!o.input) return console.error('Missing input');
    if(!o.output) return console.error('Missing output');

    var cwd = process.cwd();
    var albumTemplate = path.join(o.templates, 'album.html');
    var photoTemplate = path.join(o.templates, 'photo.html');
    var config = o.config? require(path.join(cwd, o.config)): {};

    if(!fs.existsSync(albumTemplate)) return console.error('Template directory is missing album.html');
    if(!fs.existsSync(photoTemplate)) return console.error('Template directory is missing photo.html');

    console.log('should convert now');
};
