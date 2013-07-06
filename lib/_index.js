var fs = require('fs');
var extend = require('util')._extend;
var path = require('path');

var utils = require('./utils');


function write(config, tpl, albums) {
    var p = path.join(config.output, 'index.html');
    var ctx = extend(config, {});
    ctx.albums = albums;
    var data = tpl(ctx);

    fs.writeFile(p, data, utils.logError);
}
exports.write = write;
