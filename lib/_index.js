var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var utils = require('./utils');


function write(config, root, tpl, albums) {
    var p = path.join(root, 'index.html');
    var ctx = extend(config, {});
    ctx.albums = albums;
    var data = tpl(ctx);

    fs.writeFile(p, data, utils.logError);
}
exports.write = write;
