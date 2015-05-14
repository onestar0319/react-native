/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

function handleErrorWithRedBox(e, isFatal) {
  try {
    require('ExceptionsManager').handleException(e, isFatal);
  } catch(ee) {
    console.log('Failed to print error: ', ee.message);
  }
}

function setupRedBoxErrorHandler() {
  var ErrorUtils = require('ErrorUtils');
  ErrorUtils.setGlobalHandler(handleErrorWithRedBox);
}

function setupRedBoxConsoleErrorHandler() {
  // ExceptionsManager transitively requires Promise so we install it after
  var ExceptionsManager = require('ExceptionsManager');
  var Platform = require('Platform');
  // TODO (#6925182): Enable console.error redbox on Android
  if (__DEV__ && Platform.OS === 'ios') {
    ExceptionsManager.installConsoleErrorReporter();
  }
}

/**
 * Sets up a set of window environment wrappers that ensure that the
 * BatchedBridge is flushed after each tick. In both the case of the
 * `UIWebView` based `RCTJavaScriptCaller` and `RCTContextCaller`, we
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
  var RCTAlertManager = require('NativeModules').AlertManager;
  if (!GLOBAL.alert) {
    GLOBAL.alert = function(text) {
      var alertOpts = {
        title: 'Alert',
        message: '' + text,
        buttons: [{'cancel': 'Okay'}],
      };
      RCTAlertManager.alertWithArgs(alertOpts, null);
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

  var fetchPolyfill = require('fetch');
  GLOBAL.fetch = fetchPolyfill.fetch;
  GLOBAL.Headers = fetchPolyfill.Headers;
  GLOBAL.Request = fetchPolyfill.Request;
  GLOBAL.Response = fetchPolyfill.Response;
}

function setupGeolocation() {
  GLOBAL.navigator = GLOBAL.navigator || {};
  GLOBAL.navigator.geolocation = require('Geolocation');
}

setupRedBoxErrorHandler();
setupTimers();
setupAlert();
setupPromise();
setupXHR();
setupRedBoxConsoleErrorHandler();
setupGeolocation();
