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

import type {SchemaType} from '../../CodegenSchema.js';

function parse(filename: string): ?SchemaType {
  try {
    // $FlowFixMe[unsupported-syntax] Can't require dynamic variables
    return require(filename);
  } catch (err) {
    // Ignore
  }
}

module.exports = {
  parse,
};
