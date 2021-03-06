var fs = require('fs');
var path = require('path');

var rmdir = require('rmdir');


function attachAdjacency(data, prop) {
    var len = data.length;

    return data.map(function(d, i) {
        d.previous = i === 0? data[len - 1][prop]: data[i - 1][prop];
        d.next = i === len - 1? data[0][prop]: data[i + 1][prop];

        return d;
    });
}
exports.attachAdjacency = attachAdjacency;

function stripExt(p) {
    return path.basename(p, path.extname(p));
}
exports.stripExt = stripExt;

function id(a) {
    return a;
}
exports.id = id;

function mkdir(root, cb) {
    fs.exists(root, function(exists) {
        if(exists) return cb(null, root);

        recurse(root, 0);
   });

    function recurse(p, i) {
        var parent = path.dirname(p);

        fs.exists(parent, function(exists) {
            if(exists) {
                if(i !== 0) mk(p, function() {
                    mkdir(root, cb);
                });
                else mk(p, cb);
            }
            else recurse(parent, i + 1);
        });
    }

    function mk(p, cb) {
        fs.mkdir(p, function(err) {
            // skip errors
            if(err) return cb(null);

            cb(null, p);
        });
    }
}
exports.mkdir = mkdir;

exports.rmdir = rmdir;

function logError(err) {
    if(err) return console.error(err);
}
exports.logError = logError;

function enumerate(arr) {
    return arr.map(function(v, i) {
        return {
            i: i,
            data: v
        };
    });
}
exports.enumerate = enumerate;

function toObject(arr, k, v) {
    var ret = {};

    arr.forEach(function(o) {
        if(k in o) ret[o[k]] = o[v];
    });

    return ret;
}
exports.toObject = toObject;

function convertToSortedList(type, cb) {
    return function(err, d) {
        cb(err, {
            type: type,
            data: toSortedList(d)
        });
    };
}
exports.convertToSortedList = convertToSortedList;

function toSortedList(d) {
    var ret = [];

    d.forEach(function(v) {
        ret[v.i] = v.data;
    });

    return ret;
}

function idfy(val) {
    return val.toLowerCase().replace(/[ \-]+/g, '_').replace(/\.+/g, '');
}
exports.idfy = idfy;
