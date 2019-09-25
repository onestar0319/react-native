/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const createReactNativeComponentClass = require('../Renderer/shims/createReactNativeComponentClass');
const getNativeComponentAttributes = require('./getNativeComponentAttributes');

import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';

/**
 * Creates values that can be used like React components which represent native
 * view managers. You should create JavaScript modules that wrap these values so
 * that the results are memoized. Example:
 *
 *   const View = requireNativeComponent('RCTView');
 *
 */

const requireNativeComponent = <T>(uiViewClassName: string): HostComponent<T> =>
  ((createReactNativeComponentClass(uiViewClassName, () =>
    getNativeComponentAttributes(uiViewClassName),
  ): any): HostComponent<T>);

module.exports = requireNativeComponent;
