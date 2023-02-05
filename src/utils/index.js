"use strict";
exports.__esModule = true;
exports.capitalize = exports.camelize = exports.hasChanged = exports.isNumber = exports.isString = exports.isArray = exports.isFunction = exports.isObject = void 0;
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
exports.isObject = isObject;
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
function isArray(value) {
    return Array.isArray(value);
}
exports.isArray = isArray;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function isNumber(value) {
    return typeof value === 'number';
}
exports.isNumber = isNumber;
function hasChanged(oldValue, value) {
    return value !== oldValue && (value === value || oldValue === oldValue);
}
exports.hasChanged = hasChanged;
var camelizeRE = /-(\w)/g;
function camelize(str) {
    return str.replace(camelizeRE, function (_, c) { return (c ? c.toUpperCase() : ''); });
}
exports.camelize = camelize;
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.capitalize = capitalize;
