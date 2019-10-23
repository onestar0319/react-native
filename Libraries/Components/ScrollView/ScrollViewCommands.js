/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import * as React from 'react';

import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';

type ScrollViewNativeComponentType = HostComponent<mixed>;
interface NativeCommands {
  +flashScrollIndicators: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
  ) => void;
  +scrollTo: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    x: number,
    y: number,
    animated: boolean,
  ) => void;
  +scrollToEnd: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    animated: boolean,
  ) => void;
  +zoomToRect: (
    viewRef: React.ElementRef<ScrollViewNativeComponentType>,
    rect: {|
      x: number,
      y: number,
      width: number,
      height: number,
      animated?: boolean,
    |},
    animated?: boolean,
  ) => void;
}

export default (codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    'flashScrollIndicators',
    'scrollTo',
    'scrollToEnd',
    'zoomToRect',
  ],
}): NativeCommands);
