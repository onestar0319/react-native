/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule createReactNativeComponentClass
 * @flow
 */

"use strict";

var ReactElement = require('ReactElement');
var ReactNativeBaseComponent = require('ReactNativeBaseComponent');

// See also ReactNativeBaseComponent
type ReactNativeBaseComponentViewConfig = {
  validAttributes: Object;
  uiViewClassName: string;
}

/**
 * @param {string} config iOS View configuration.
 * @private
 */
var createReactNativeComponentClass = function(
  viewConfig: ReactNativeBaseComponentViewConfig
): Function { // returning Function is lossy :/
  var Constructor = function(element) {
    this._currentElement = element;

    this._rootNodeID = null;
    this._renderedChildren = null;
    this.previousFlattenedStyle = null;
  };
  Constructor.displayName = viewConfig.uiViewClassName;
  Constructor.prototype = new ReactNativeBaseComponent(viewConfig);

  return Constructor;
};

module.exports = createReactNativeComponentClass;
