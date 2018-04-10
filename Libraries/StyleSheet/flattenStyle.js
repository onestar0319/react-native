/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule flattenStyle
 * @flow
 * @format
 */
'use strict';

import type {
  DangerouslyImpreciseStyle,
  DangerouslyImpreciseStyleProp,
} from 'StyleSheet';

function flattenStyle(
  style: ?DangerouslyImpreciseStyleProp,
): ?DangerouslyImpreciseStyle {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }

  if (!Array.isArray(style)) {
    return style;
  }

  var result = {};
  for (var i = 0, styleLength = style.length; i < styleLength; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      for (var key in computedStyle) {
        result[key] = computedStyle[key];
      }
    }
  }
  return result;
}

module.exports = flattenStyle;
