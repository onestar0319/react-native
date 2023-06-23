/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {polyfillGlobal} from '../Utilities/PolyfillFunctions';

polyfillGlobal(
  'IntersectionObserver',
  () => require('../IntersectionObserver/IntersectionObserver').default,
);
