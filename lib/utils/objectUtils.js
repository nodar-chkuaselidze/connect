"use strict";

exports.__esModule = true;
exports.clone = clone;
exports.entries = entries;
exports.deepClone = deepClone;
exports.snapshot = snapshot;
exports.objectValues = objectValues;

function clone(obj) {
  const jsonString = JSON.stringify(obj);

  if (jsonString === undefined) {
    // jsonString === undefined IF and only IF obj === undefined
    // therefore no need to clone
    return obj;
  }

  return JSON.parse(jsonString);
}

function entries(obj) {
  const keys = Object.keys(obj);
  return keys.map(key => [key, obj[key]]);
}

function deepClone(obj, hash = new WeakMap()) {// if (Object(obj) !== obj) return obj; // primitives
  // if (hash.has(obj)) return hash.get(obj); // cyclic reference
  // const result = Array.isArray(obj) ? [] : obj.constructor ? new obj.constructor() : Object.create(null);
  // hash.set(obj, result);
  // if (obj instanceof Map) { Array.from(obj, ([key, val]) => result.set(key, deepClone(val, hash))); }
  // return Object.assign(result, ...Object.keys(obj).map(
  //     key => ({ [key]: deepClone(obj[key], hash) })));
}

function snapshot(obj) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  const temp = new obj.constructor();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      temp[key] = snapshot(obj[key]);
    }
  }

  return temp;
}

function objectValues(object) {
  return Object.keys(object).map(key => object[key]);
}