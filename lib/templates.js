var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;

var handlebars = require('handlebars');
var yaml = require('js-yaml');


module.exports = function(root, layout, templates) {
    if(!layout) return console.error('Missing layout');
    if(!templates) return console.error('Missing templates');

    var ret = {};
    var templatesFound = 0;
    var layoutTemplate = compileTemplate(root, layout);

    if(!layoutTemplate) return console.error('Layout template is missing');

    templates.forEach(function(name) {
        var p = path.join(root, name + '.html');

        if(fs.existsSync(p)) {
            var parts = fs.readFileSync(p, 'utf-8').split('---');
            var body = parts[parts.length - 1];
            var template = handlebars.compile(body);
            var headMatter = parts.length > 1? yaml.load(parts[0]): {};

            ret[name] = function(ctx) {
                return layoutTemplate(extend({
                    content: template(ctx)
                }, extend(headMatter, ctx)));
            };

            templatesFound++;
        }
        else console.error('Template directory is missing ' + name);
    });

    return templatesFound == templates.length && ret;
};

function compileTemplate(root, name) {
    var p = path.join(root, name + '.html');

    if(fs.existsSync(p)) return handlebars.compile(fs.readFileSync(p, 'utf-8'));
}
