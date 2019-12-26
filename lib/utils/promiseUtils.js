"use strict";

exports.__esModule = true;
exports.resolveAfter = resolveAfter;

async function resolveAfter(msec, value) {
  return await new Promise(resolve => {
    setTimeout(resolve, msec, value);
  });
}