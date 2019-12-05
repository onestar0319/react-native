/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Common interface
  +captureHeap: (path: string) => void;

  // Android only
  +captureComplete: (path: string, error: ?string) => void;
}

export default (TurboModuleRegistry.get<Spec>('HeapCapture'): ?Spec);
