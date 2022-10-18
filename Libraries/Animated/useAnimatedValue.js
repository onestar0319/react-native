/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AnimatedValueConfig} from './nodes/AnimatedValue';

import Animated from './Animated';
import {useRef} from 'react';

export default function useAnimatedValue(
  initialValue: number,
  config?: ?AnimatedValueConfig,
): Animated.Value {
  const ref = useRef(null);
  if (ref.current == null) {
    ref.current = new Animated.Value(initialValue, config);
  }
  return ref.current;
}
