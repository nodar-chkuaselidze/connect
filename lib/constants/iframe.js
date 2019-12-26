"use strict";

exports.__esModule = true;
exports.CALL = exports.ERROR = exports.INIT = exports.LOADED = exports.BOOTSTRAP = void 0;
// Message called from iframe.html inline script before "window.onload" event. This is first message from iframe to window.opener.
const BOOTSTRAP = 'iframe-bootstrap'; // Message from iframe.js to window.opener, called after "window.onload" event. This is second message from iframe to window.opener.

exports.BOOTSTRAP = BOOTSTRAP;
const LOADED = 'iframe-loaded'; // Message from window.opener to iframe.js

exports.LOADED = LOADED;
const INIT = 'iframe-init'; // Error message from iframe.js to window.opener. Could be thrown during iframe initialization process

exports.INIT = INIT;
const ERROR = 'iframe-error'; // Message from window.opener to iframe. Call method

exports.ERROR = ERROR;
const CALL = 'iframe-call';
exports.CALL = CALL;