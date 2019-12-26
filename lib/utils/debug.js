"use strict";

exports.__esModule = true;
exports.popupConsole = exports.enableByPrefix = exports.getLog = exports.enable = exports.init = exports.default = void 0;
// https://stackoverflow.com/questions/7505623/colors-in-javascript-console
// https://github.com/pimterry/loglevel/blob/master/lib/loglevel.js
// http://www.color-hex.com/color-palette/5016
const colors = {
  // green
  'DescriptorStream': 'color: #77ab59',
  'DeviceList': 'color: #36802d',
  'Device': 'color: #bada55',
  'Core': 'color: #c9df8a',
  'IFrame': 'color: #FFFFFF; background: #f4a742;',
  'Popup': 'color: #f48a00'
};

class Log {
  constructor(prefix, enabled = false) {
    this.prefix = prefix;
    this.enabled = enabled;
    this.messages = [];
    this.css = colors[prefix] || 'color: #000000; background: #FFFFFF;';
  }

  addMessage(level, prefix, ...args) {
    this.messages.push({
      level: level,
      prefix: prefix,
      message: args,
      timestamp: new Date().getTime()
    });
  }

  log(...args) {
    this.addMessage('log', this.prefix, ...args); // eslint-disable-next-line no-console

    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  error(...args) {
    this.addMessage('error', this.prefix, ...args); // eslint-disable-next-line no-console

    if (this.enabled) {
      console.error(this.prefix, ...args);
    }
  }

  warn(...args) {
    this.addMessage('warn', this.prefix, ...args); // eslint-disable-next-line no-console

    if (this.enabled) {
      console.warn(this.prefix, ...args);
    }
  }

  debug(...args) {
    this.addMessage('debug', this.prefix, ...args); // eslint-disable-next-line no-console

    if (this.enabled) {
      console.log('%c' + this.prefix, this.css, ...args);
    }
  }

}

exports.default = Log;
const _logs = {};

const init = (prefix, enabled) => {
  const enab = typeof enabled === 'boolean' ? enabled : false;
  const instance = new Log(prefix, enab);
  _logs[prefix] = instance;
  return instance;
};

exports.init = init;

const enable = enabled => {
  for (const l of Object.keys(_logs)) {
    _logs[l].enabled = enabled;
  }
};

exports.enable = enable;

const getLog = args => {
  // if
  let logs = [];

  for (const l of Object.keys(_logs)) {
    logs = logs.concat(_logs[l].messages);
  }

  logs.sort((a, b) => {
    return a.timestamp - b.timestamp;
  });
  return logs;
};

exports.getLog = getLog;

const enableByPrefix = (prefix, enabled) => {
  if (_logs[prefix]) {
    _logs[prefix].enabled = enabled;
  }
}; // TODO: enable/disable log at runtime


exports.enableByPrefix = enableByPrefix;

const popupConsole = (tag, postMessage) => {
  const c = global.console;
  const orig = {
    error: c.error,
    // warn: c.warn,
    info: c.info,
    debug: c.debug,
    log: c.log
  };
  const log = [];

  const inject = (method, level) => {
    return (...args) => {
      // args.unshift('[popup.js]');
      const time = new Date().toUTCString();
      log.push([level, time].concat(args));
      postMessage.apply(void 0, [{
        type: tag,
        level: level,
        time: time,
        args: JSON.stringify(args)
      } // { type: 'LOG', level: level, time: time, args: JSON.stringify(deepClone(args)) }
      ]);
      return method.apply(c, args);
    };
  };

  for (const level in orig) {
    c[level] = inject(orig[level], level);
  }
};

exports.popupConsole = popupConsole;