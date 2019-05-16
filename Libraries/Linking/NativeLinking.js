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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';
import Platform from 'Platform';

export interface Spec extends TurboModule {
  // Common interface
  +getInitialURL: () => Promise<string>;
  +canOpenURL: (url: string) => Promise<boolean>;
  +openURL: (url: string) => Promise<void>;
  +openSettings: () => Promise<void>;

  // Android only
  +sendIntent: (
    action: string,
    extras: ?Array<{key: string, value: string | number | boolean}>,
  ) => Promise<void>;

  // Events
  +addListener: (eventName: string) => void;
  +removeListeners: (count: number) => void;
}

export default (Platform.OS === 'ios'
  ? TurboModuleRegistry.getEnforcing<Spec>('LinkingManager')
  : TurboModuleRegistry.getEnforcing<Spec>('IntentAndroid'));
