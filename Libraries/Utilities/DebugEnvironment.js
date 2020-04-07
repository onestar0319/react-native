/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

export let isAsyncDebugging: boolean = false;

if (__DEV__) {
  // These native interfaces don't exist in asynchronous debugging environments.
  isAsyncDebugging =
    !global.nativeExtensions &&
    !global.nativeCallSyncHook &&
    !global.RN$Bridgeless;
}
