/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Sets up global variables typical in most JavaScript environments.
 *
 * 1. Global timers (via `setTimeout` etc).
 * 2. Global console object.
 * 3. Hooks for printing stack traces with source maps.
 *
 * Leaves enough room in the environment for implementing your own:
 * 1. Require system.
 * 2. Bridged modules.
 *
 * @providesModule InitializeJavaScriptAppEngine
 */

/* eslint global-strict: 0 */
/* globals GLOBAL: true, window: true */

// Just to make sure the JS gets packaged up.
require('RCTDeviceEventEmitter');

if (typeof GLOBAL === 'undefined') {
  GLOBAL = this;
}

if (typeof window === 'undefined') {
  window = GLOBAL;
}

/**
 * The document must be shimmed before anything else that might define the
 * `ExecutionEnvironment` module (which checks for `document.createElement`).
 */
function setupDocumentShim() {
  // The browser defines Text and Image globals by default. If you forget to
  // require them, then the error message is very confusing.
  function getInvalidGlobalUseError(name) {
    return new Error(
      'You are trying to render the global ' + name + ' variable as a ' +
      'React element. You probably forgot to require ' + name + '.'
    );
  }
  GLOBAL.Text = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Text');
    }
  };
  GLOBAL.Image = {
    get defaultProps() {
      throw getInvalidGlobalUseError('Image');
    }
  };
  if (!GLOBAL.document) {
    // This shouldn't be needed but scroller library fails without it. If
    // we fixed the scroller, we wouldn't need this.
    GLOBAL.document = {body: {}};
  }
  // Force `ExecutionEnvironment.canUseDOM` to be false.
  GLOBAL.document.createElement = null;
}

function handleErrorWithRedBox(e) {
  var RKExceptionsManager = require('NativeModules').RKExceptionsManager;
  var errorToString = require('errorToString');
  var loadSourceMap = require('loadSourceMap');

  GLOBAL.console.error(
    'Error: ' +
    '\n stack: \n' + e.stack +
    '\n URL: ' + e.sourceURL +
    '\n line: ' + e.line +
    '\n message: ' + e.message
  );

  if (RKExceptionsManager) {
    RKExceptionsManager.reportUnhandledException(e.message, errorToString(e));
    if (__DEV__) {
      try {
        var sourceMapInstance = loadSourceMap();
        var prettyStack = errorToString(e, sourceMapInstance);
        RKExceptionsManager.updateExceptionMessage(e.message, prettyStack);
      } catch (ee) {
        GLOBAL.console.error('#CLOWNTOWN (error while displaying error): ' + ee.message);
      }
    }
  }
}

function setupRedBoxErrorHandler() {
  var ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleErrorWithRedBox);
}

/**
 * Sets up a set of window environment wrappers that ensure that the
 * BatchedBridge is flushed after each tick. In both the case of the
 * `UIWebView` based `RKJavaScriptCaller` and `RKContextCaller`, we
 * implement our own custom timing bridge that should be immune to
 * unexplainably dropped timing signals.
 */
function setupTimers() {
  var JSTimers = require('JSTimers');
  GLOBAL.setTimeout = JSTimers.setTimeout;
  GLOBAL.setInterval = JSTimers.setInterval;
  GLOBAL.setImmediate = JSTimers.setImmediate;
  GLOBAL.clearTimeout = JSTimers.clearTimeout;
  GLOBAL.clearInterval = JSTimers.clearInterval;
  GLOBAL.clearImmediate = JSTimers.clearImmediate;
  GLOBAL.cancelAnimationFrame = JSTimers.clearInterval;
  GLOBAL.requestAnimationFrame = function(cb) {
    /*requestAnimationFrame() { [native code] };*/  // Trick scroller library
    return JSTimers.requestAnimationFrame(cb);      // into thinking it's native
  };
}

function setupAlert() {
  var RKAlertManager = require('RKAlertManager');
  if (!GLOBAL.alert) {
    GLOBAL.alert = function(text) {
      var alertOpts = {
        title: 'Alert',
        message: '' + text,
        buttons: [{'cancel': 'Okay'}],
      };
      RKAlertManager.alertWithArgs(alertOpts, null);
    };
  }
}

function setupPromise() {
  // The native Promise implementation throws the following error:
  // ERROR: Event loop not supported.
  GLOBAL.Promise = require('Promise');
}

function setupXHR() {
  // The native XMLHttpRequest in Chrome dev tools is CORS aware and won't
  // let you fetch anything from the internet
  GLOBAL.XMLHttpRequest = require('XMLHttpRequest');
  GLOBAL.fetch = require('fetch');
}

function setupGeolocation() {
  GLOBAL.navigator = GLOBAL.navigator || {};
  GLOBAL.navigator.geolocation = require('GeoLocation');
}

setupDocumentShim();
setupRedBoxErrorHandler();
setupTimers();
setupAlert();
setupPromise();
setupXHR();
setupGeolocation();
