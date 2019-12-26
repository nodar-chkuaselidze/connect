"use strict";

exports.__esModule = true;
exports.create = create;
exports.createAsync = createAsync;
exports.resolveTimeoutPromise = resolveTimeoutPromise;
exports.rejectTimeoutPromise = rejectTimeoutPromise;

function create(arg, device) {
  let localResolve = t => {};

  let localReject = e => {};

  let id; // eslint-disable-next-line no-async-promise-executor

  const promise = new Promise(async (resolve, reject) => {
    localResolve = resolve;
    localReject = reject;

    if (typeof arg === 'function') {
      try {
        await arg();
      } catch (error) {
        reject(error);
      }
    }

    if (typeof arg === 'string') id = arg;
  });
  return {
    id: id,
    device,
    resolve: localResolve,
    reject: localReject,
    promise
  };
}

function createAsync(innerFn) {
  let localResolve = t => {};

  let localReject = e => {};

  const promise = new Promise((resolve, reject) => {
    localResolve = resolve;
    localReject = reject;
  });

  const inner = async () => {
    await innerFn();
  };

  return {
    resolve: localResolve,
    reject: localReject,
    promise,
    run: () => {
      inner();
      return promise;
    }
  };
}

function resolveTimeoutPromise(delay, result) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(result);
    }, delay);
  });
}

function rejectTimeoutPromise(delay, error) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(error);
    }, delay);
  });
}