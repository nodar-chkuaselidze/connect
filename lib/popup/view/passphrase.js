"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.initPassphraseView = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _common = require("./common");

const initPassphraseView = payload => {
  (0, _common.showView)('passphrase');

  const view = _common.container.getElementsByClassName('passphrase')[0];

  const deviceNameSpan = _common.container.getElementsByClassName('device-name')[0];

  const input1 = _common.container.getElementsByClassName('pass')[0];

  const input2 = _common.container.getElementsByClassName('pass-check')[0];

  const toggle = _common.container.getElementsByClassName('show-passphrase')[0];

  const enter = _common.container.getElementsByClassName('submit')[0];

  let inputType = 'password';
  deviceNameSpan.innerText = payload.device.label;
  /* Functions */

  const validation = () => {
    if (input1.value !== input2.value) {
      enter.disabled = true;
      view.classList.add('not-valid');
    } else {
      enter.disabled = false;
      view.classList.remove('not-valid');
    }
  };

  const toggleInputFontStyle = input => {
    if (inputType === 'text') {
      // input.classList.add('text');
      input.setAttribute('type', 'text'); // Since passphrase is visible there's no need to force user to fill the passphrase twice
      // - disable input2
      // - write automatically into input2 as the user is writing into input1 (listen to input event)

      input2.disabled = true;
      input2.value = input1.value;
      validation();
    } else if (inputType === 'password') {
      // input.classList.remove('text');
      input.setAttribute('type', 'password');
      input2.disabled = false;
      input2.value = '';
      validation();
    }
  };

  const handleToggleClick = () => {
    inputType = inputType === 'text' ? 'password' : 'text';
    toggleInputFontStyle(input1);
    toggleInputFontStyle(input2);
  };

  const handleEnterClick = () => {
    input1.blur();
    input2.blur(); // eslint-disable-next-line no-use-before-define

    window.removeEventListener('keydown', handleWindowKeydown);
    (0, _common.showView)('loader');
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_PASSPHRASE, {
      save: true,
      value: input1.value
    }));
  };

  const handleWindowKeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enter.click();
    }
  };
  /* Functions: END */


  input1.addEventListener('input', () => {
    validation();

    if (inputType === 'text') {
      input2.value = input1.value;
      validation();
    }
  }, false);
  input2.addEventListener('input', validation, false);
  toggle.addEventListener('click', handleToggleClick);
  enter.addEventListener('click', handleEnterClick);
  window.addEventListener('keydown', handleWindowKeydown, false);
  input1.focus();
};

exports.initPassphraseView = initPassphraseView;