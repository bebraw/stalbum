var fs = require('fs');
var path = require('path');

var handlebars = require('handlebars');


module.exports = function(root, templates) {
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
};
