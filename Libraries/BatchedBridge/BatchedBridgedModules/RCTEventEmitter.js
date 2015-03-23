/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTEventEmitter
 */
'use strict';

var ReactIOSEventEmitter = require('ReactIOSEventEmitter');

// Completely locally implemented - no native hooks.
module.exports = ReactIOSEventEmitter;
