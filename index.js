"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var process_1 = require("process");
var main = function () {
    if (process_1.argv.length < 3)
        return;
    var file_path = process_1.argv[2];
    var tz_raw = fs_1.readFileSync(file_path).toString().trim();
    var parameter_index = tz_raw.indexOf('parameter');
    var libs = tz_raw.slice(0, parameter_index).match(/@[\w\.]+/g);
    var libs_raw = libs ? libs.map(function (x) { return fs_1.readFileSync(x.slice(1)).toString().trim(); }) : [];
    var method_map = parse_libs(libs_raw);
    var method_result = apply_methods(tz_raw.slice(parameter_index), method_map);
    var dup_expand_result = dup_expand(method_result);
    var result = dup_expand_result;
    var output_name = file_path.replace('.tzext', '.miext.tz');
    fs_1.writeFile(output_name, result, function (err) {
        console.log(err || output_name + ' written');
    });
};
var dup_expand = function (content) {
    return content.replace(/dup\[\s*?\d+?\s*?(:\s*?\d+?\s*?)*?\]/g, function (_raw) {
        var raw = _raw.slice(4, -1);
        var nums = raw.split(/:/g).map(function (x) { return parseInt(x.trim()); });
        nums.reverse();
        var result = [];
        nums.forEach(function (x, i) {
            result.push('D' + 'U'.repeat(x + i + 1) + 'P');
        });
        return result.join(';');
    });
};
var apply_methods = function (tz_raw, method_map) {
    return tz_raw.replace(/@+?[\w\ ]+?[};\r\n]/g, function (_raw) {
        var raw = _raw.slice(0, -1).replace(/^@+/g, '').trim();
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
            identity.split('|').forEach(function (id) {
                method_map[id.trim()] = { args: args, definition: definition.replace(/[\r\n]+/g, ' ') };
            });
        });
    });
    return method_map;
};
main();
