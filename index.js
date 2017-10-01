"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var process_1 = require("process");
var main = function () {
    if (process_1.argv.length < 3)
        return;
    var file_path = process_1.argv[2];
    var tz_raw = fs_1.readFileSync(file_path).toString().trim();
    var libs = tz_raw.slice(0, tz_raw.indexOf('parameter')).match(/@[\w\.]+/g);
    var libs_raw = libs ? libs.map(function (x) { return fs_1.readFileSync(x.slice(1)).toString().trim(); }) : [];
    var method_map = parse_libs(libs_raw);
    var result = apply_methods(tz_raw, method_map);
    console.log(result);
};
var apply_methods = function (tz_raw, method_map) {
    return tz_raw.replace(/@[\w\ ]+?[;\r\n]/g, function (_raw) {
        var raw = _raw.slice(1, -1).trim();
        var _a = raw.split(/\s+/g), identity = _a[0], args = _a.slice(1);
        var method = method_map[identity];
        if (!method)
            return _raw;
        var arg_map = {};
        args.forEach(function (x, i) { return arg_map[method.args[i]] = x; });
        var rendered = method.args.length ? method.definition.replace(new RegExp(method.args.map(function (x) { return '@' + x + '\\b'; }).join('|'), 'g'), function (_raw) {
            var raw = _raw.slice(1);
            return arg_map[raw] || _raw;
        }) : method.definition;
        return rendered + _raw.slice(-1);
    });
};
var parse_libs = function (libs_raw) {
    var method_map = {};
    libs_raw.forEach(function (raw) {
        raw.split(/;;/g).forEach(function (s) {
            s = s.trim();
            if (!s)
                return;
            var _a = s.split('=').map(function (x) { return x.trim(); }), vars = _a[0], definition = _a[1];
            var _b = vars.split(/\ /g).map(function (x) { return x.trim(); }), identity = _b[0], args = _b.slice(1);
            method_map[identity] = { args: args, definition: definition };
        });
    });
    return method_map;
};
main();
