/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

export type FeatureFlags = {|
  isLayoutAnimationEnabled: () => boolean,
|};

const ReactNativeFeatureFlags: FeatureFlags = {
  isLayoutAnimationEnabled: () => true,
};

module.exports = ReactNativeFeatureFlags;
