/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const Platform = require('./Platform');
const invariant = require('invariant');

const MetroHMRClient = require('metro/src/lib/bundle-modules/HMRClient');

import NativeRedBox from '../NativeModules/specs/NativeRedBox';

import type {ExtendedError} from '../Core/Devtools/parseErrorStack';

const pendingEntryPoints = [];
let hmrClient = null;
let hmrUnavailableReason: string | null = null;
let isRegisteringEntryPoints = false;

export type HMRClientNativeInterface = {|
  enable(): void,
  disable(): void,
  registerBundle(requestUrl: string): void,
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
  ): void,
|};

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient: HMRClientNativeInterface = {
  enable() {
    if (hmrUnavailableReason !== null) {
      // If HMR became unavailable while you weren't using it,
      // explain why when you try to turn it on.
      // This is an error (and not a warning) because it is shown
      // in response to a direct user action.
      throw new Error(hmrUnavailableReason);
    }

    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    const LoadingView = require('./LoadingView');

    // We use this for internal logging only.
    // It doesn't affect the logic.
    hmrClient.send(JSON.stringify({type: 'log-opt-in'}));

    // When toggling Fast Refresh on, we might already have some stashed updates.
    // Since they'll get applied now, we'll show a banner.
    const hasUpdates =
      hmrClient.hasPendingUpdates() && !isRegisteringEntryPoints;

    if (hasUpdates) {
      LoadingView.showMessage('Refreshing...', 'refresh');
    }
    try {
      hmrClient.enable();
    } finally {
      if (hasUpdates) {
        LoadingView.hide();
      }
    }
  },

  disable() {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    hmrClient.disable();
  },

  registerBundle(requestUrl: string) {
    invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
    pendingEntryPoints.push(requestUrl);
    registerBundleEntryPoints(hmrClient);
  },

  // Called once by the bridge on startup, even if Fast Refresh is off.
  // It creates the HMR client but doesn't actually set up the socket yet.
  setup(
    platform: string,
    bundleEntry: string,
    host: string,
    port: number | string,
    isEnabled: boolean,
  ) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required paramenter `bundleEntry`');
    invariant(host, 'Missing required paramenter `host`');
    invariant(!hmrClient, 'Cannot initialize hmrClient twice');

    // Moving to top gives errors due to NativeModules not being initialized
    const LoadingView = require('./LoadingView');

    const wsHost = port !== null && port !== '' ? `${host}:${port}` : host;
    const client = new MetroHMRClient(`ws://${wsHost}/hot`);
    hmrClient = client;

    pendingEntryPoints.push(
      `ws://${wsHost}/hot?bundleEntry=${bundleEntry}&platform=${platform}`,
    );

    client.on('connection-error', e => {
      let error = `Fast Refresh isn't working because it cannot connect to the development server.

Try the following to fix the issue:
- Ensure that the Metro Server is running and available on the same network`;

      if (Platform.OS === 'ios') {
        error += `
- Ensure that the Metro server URL is correctly set in AppDelegate`;
      } else {
        error += `
- Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
- If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
- If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081`;
      }

      error += `

URL: ${host}:${port}

Error: ${e.message}`;

      setHMRUnavailableReason(error);
    });

    function isFastRefreshActive() {
      return client.isEnabled() && !isRegisteringEntryPoints;
    }

    client.on('bundle-registered', () => {
      isRegisteringEntryPoints = false;
    });

    function dismissRedbox() {
      if (
        Platform.OS === 'ios' &&
        NativeRedBox != null &&
        NativeRedBox.dismiss != null
      ) {
        NativeRedBox.dismiss();
      } else {
        const NativeExceptionsManager = require('../Core/NativeExceptionsManager')
          .default;
        NativeExceptionsManager &&
          NativeExceptionsManager.dismissRedbox &&
          NativeExceptionsManager.dismissRedbox();
      }
    }

    client.on('update-start', () => {
      if (isFastRefreshActive()) {
        LoadingView.showMessage('Refreshing...', 'refresh');
      }
    });

    client.on('update', () => {
      if (isFastRefreshActive()) {
        dismissRedbox();
      }
    });

    client.on('update-done', () => {
      LoadingView.hide();
    });

    client.on('error', data => {
      LoadingView.hide();

      if (data.type === 'GraphNotFoundError') {
        client.close();
        setHMRUnavailableReason(
          'The Metro server has restarted since the last edit. Fast Refresh will be disabled until you reload the application.',
        );
      } else if (data.type === 'RevisionNotFoundError') {
        client.close();
        setHMRUnavailableReason(
          'The Metro server and the client are out of sync. Fast Refresh will be disabled until you reload the application.',
        );
      } else if (isFastRefreshActive()) {
        // Even if there is already a redbox, syntax errors are more important.
        // Otherwise you risk seeing a stale runtime error while a syntax error is more recent.
        dismissRedbox();
        const error: ExtendedError = new Error(`${data.type} ${data.message}`);
        // Symbolicating compile errors is wasted effort
        // because the stack trace is meaningless:
        error.preventSymbolication = true;
        throw error;
      }
    });

    client.on('close', data => {
      LoadingView.hide();
      setHMRUnavailableReason(
        'Disconnected from the Metro server. Fast Refresh will be disabled until you reload the application.',
      );
    });

    if (isEnabled) {
      HMRClient.enable();
    } else {
      HMRClient.disable();
    }

    registerBundleEntryPoints(hmrClient);
  },
};

function setHMRUnavailableReason(reason) {
  invariant(hmrClient, 'Expected HMRClient.setup() call at startup.');
  if (hmrUnavailableReason !== null) {
    // Don't show more than one warning.
    return;
  }
  hmrUnavailableReason = reason;
  if (hmrClient.shouldApplyUpdates) {
    // If HMR is currently enabled, show a warning.
    console.warn(reason);
    // (Not using the `warning` module to prevent a Buck cycle.)
  }
}

function registerBundleEntryPoints(client) {
  if (pendingEntryPoints.length > 0) {
    isRegisteringEntryPoints = true;
    client.send(
      JSON.stringify({
        type: 'register-entrypoints',
        entryPoints: pendingEntryPoints,
      }),
    );
    pendingEntryPoints.length = 0;
  }
}

module.exports = HMRClient;
