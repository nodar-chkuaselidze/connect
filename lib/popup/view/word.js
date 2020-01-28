"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.initWordView = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _common = require("./common");

var _bip = _interopRequireDefault(require("../../utils/bip39"));

const initWordPlainView = payload => {
  (0, _common.showView)('word-plain');

  const deviceName = _common.container.getElementsByClassName('device-name')[0];

  const datalist = _common.container.getElementsByClassName('bip-words')[0];

  const input = _common.container.getElementsByClassName('word-input')[0];

  deviceName.innerText = payload.device.label;

  const clearWord = () => {
    input.value = '';
    input.focus();
  };

  const submit = () => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_WORD, input.value));
    clearWord(); // eslint-disable-next-line no-use-before-define

    window.removeEventListener('keydown', wordKeyboardHandler);
  };

  const wordKeyboardHandler = event => {
    switch (event.keyCode) {
      case 13: // enter,

      case 9:
        // tab
        event.preventDefault();
        submit();
        break;
    }
  };

  _bip.default.forEach(word => {
    const item = document.createElement('option');
    item.value = word;
    datalist.appendChild(item);
  });

  input.focus();
  window.addEventListener('keydown', wordKeyboardHandler, false);
};

const initWordMatrixView = payload => {
  (0, _common.showView)('word-matrix');

  const submit = val => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_WORD, val)); // eslint-disable-next-line no-use-before-define

    window.addEventListener('keydown', keyboardHandler, true);
  };

  const keyboardHandler = event => {
    event.preventDefault();

    switch (event.keyCode) {
      // numeric and numpad
      case 49:
      case 97:
        submit('1');
        break;

      case 50:
      case 98:
        submit('2');
        break;

      case 51:
      case 99:
        submit('3');
        break;

      case 52:
      case 100:
        submit('4');
        break;

      case 53:
      case 101:
        submit('5');
        break;

      case 54:
      case 102:
        submit('6');
        break;

      case 55:
      case 103:
        submit('7');
        break;

      case 56:
      case 104:
        submit('8');
        break;

      case 57:
      case 105:
        submit('9');
        break;
    }
  };

  const deviceName = _common.container.getElementsByClassName('device-name')[0];

  const buttons = _common.container.querySelectorAll('[data-value]');

  const wordsOnRight = _common.container.getElementsByClassName('word-right');

  deviceName.innerText = payload.device.label;

  for (let i = 0; i < buttons.length; i++) {
    buttons.item(i).addEventListener('click', event => {
      if (event.target instanceof HTMLElement) {
        const val = event.target.getAttribute('data-value');

        if (val) {
          submit(val);
        }
      }
    });
  }

  for (const word of wordsOnRight) {
    word.style.display = payload.type !== 'WordRequestType_Matrix9' ? 'none' : 'initial';
  }

  window.addEventListener('keydown', keyboardHandler, true);
};

const initWordView = payload => {
  if (payload.type === 'WordRequestType_Plain') {
    initWordPlainView(payload);
  } else {
    initWordMatrixView(payload);
  }
};

exports.initWordView = initWordView;