/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

global.require = require;
global.__d = define;

const modules = Object.create(null);

function define(moduleId, factory) {
  if (moduleId in modules) {
    // prevent repeated calls to `global.nativeRequire` to overwrite modules
    // that are already loaded
    return;
  }
  modules[moduleId] = {
    factory,
    hasError: false,
    isInitialized: false,
    exports: undefined,
  };
}

function require(moduleId) {
  const module = modules[moduleId];
  return module && module.isInitialized
    ? module.exports
    : guardedLoadModule(moduleId, module);
}

var inGuard = false;
function guardedLoadModule(moduleId, module) {
  if (global.ErrorUtils && !inGuard) {
    inGuard = true;
    var returnValue;
    try {
      returnValue = loadModuleImplementation(moduleId, module);
    } catch (e) {
      global.ErrorUtils.reportFatalError(e);
    }
    inGuard = false;
    return returnValue;
  } else {
    return loadModuleImplementation(moduleId, module);
  }
}

function loadModuleImplementation(moduleId, module) {
  if (!module) {
    global.nativeRequire(moduleId);
    module = modules[moduleId];
  }

  if (!module) {
    throw unknownModuleError(moduleId);
  }

  if (module.hasError) {
    throw moduleThrewError(moduleId);
  }

  // `require` calls int  the require polyfill itself are not analyzed and
  // replaced so that they use numeric module IDs.
  // The systrace module will expose itself on the require function so that
  // it can be used here.
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  if (__DEV__) {
    var {Systrace} = require;
  }

  const exports = module.exports = {};
  module.isInitialized = true;
  const {factory} = module;
  try {
    if (__DEV__) {
      Systrace.beginEvent('JS_require_' + moduleId);
    }

    const moduleObject = {exports};
    factory(global, require, moduleObject, exports);
    module.factory = undefined;

    if (__DEV__) {
      Systrace.endEvent();
    }
    return (module.exports = moduleObject.exports);
  } catch (e) {
    module.isInitialized = false;
    module.hasError = true;
    module.exports = undefined;
    throw e;
  }
}

function unknownModuleError(id) {
  let message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message +=
      'If you are sure the module is there, try restarting the packager or running "npm install".';
  }
  return Error(message);
}

function moduleThrewError(id) {
  return Error('Requiring module "' + id + '", which threw an exception.');
}

if (__DEV__) {
  require.Systrace = { beginEvent: () => {}, endEvent: () => {} };
}
