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

if (__DEV__) {
  const DevSettings = require('../Utilities/DevSettings');

  if (typeof DevSettings.reload !== 'function') {
    throw new Error('Could not find the reload() implementation.');
  }

  // This needs to run before the renderer initializes.
  const ReactRefreshRuntime = require('react-refresh/runtime');
  ReactRefreshRuntime.injectIntoGlobalHook(global);

  const Refresh = {
    performFullRefresh(reason: string) {
      DevSettings.reload(reason);
    },

    createSignatureFunctionForTransform:
      ReactRefreshRuntime.createSignatureFunctionForTransform,

    isLikelyComponentType: ReactRefreshRuntime.isLikelyComponentType,

    getFamilyByType: ReactRefreshRuntime.getFamilyByType,

    register: ReactRefreshRuntime.register,

    performReactRefresh() {
      if (ReactRefreshRuntime.hasUnrecoverableErrors()) {
        DevSettings.reload('Fast Refresh - Unrecoverable');
        return;
      }
      ReactRefreshRuntime.performReactRefresh();
      DevSettings.onFastRefresh();
    },
  };

  (require: any).Refresh = Refresh;
}
