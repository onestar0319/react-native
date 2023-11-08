/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {fetchJson} from './FetchUtils';
import {createDebuggerMock} from './InspectorDebuggerUtils';
import {createDeviceMock} from './InspectorDeviceUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {withServerForEachTest} from './ServerUtils';
import invariant from 'invariant';
import until from 'wait-for-expect';

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

describe('inspector proxy React Native reloads', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    projectRoot: '',
  });
  const autoCleanup = withAbortSignalForEachTest();
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('routing messages from the debugger to the latest React Native page', async () => {
    let device1, debugger_;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowIgnore[unclear-type]
        ): any);
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      /***
       * The proxy reports *two* pages.
       */
      const syntheticPage = pageList.find(
        ({title}) =>
          // NOTE: Magic string used for the synthetic page that has a stable ID
          title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      const originalPage = pageList.find(
        ({title}) => title === 'React Native (mock)',
      );
      expect(syntheticPage).not.toBeUndefined();
      expect(originalPage).not.toBeUndefined();
      expect(originalPage.id).toContain('originalPage-initial');
      expect(syntheticPage.id).not.toEqual(originalPage.id);

      // Connect to the synthetic page
      debugger_ = await createDebuggerMock(
        syntheticPage.webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      debugger_.send({
        method: 'Console.enable',
        id: 0,
      });

      await until(() =>
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-initial',
          wrappedEvent: {
            method: 'Console.enable',
            id: 0,
          },
        }),
      );

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowIgnore[unclear-type]
        ): any);
        expect(pageList).toContainEqual(
          expect.objectContaining({
            id: expect.stringContaining('originalPage-updated'),
          }),
        );
      });

      /**
       * We can reuse our existing debugger connection to the synthetic page.
       * Messages will be routed to the updated page.
       */
      debugger_.send({
        method: 'Console.disable',
        id: 1,
      });

      await until(() =>
        expect(device1.wrappedEventParsed).toBeCalledWith({
          pageId: 'originalPage-updated',
          wrappedEvent: {
            method: 'Console.disable',
            id: 1,
          },
        }),
      );
    } finally {
      device1?.close();
      debugger_?.close();
    }
  });

  test('routing messages from the latest React Native page to the debugger', async () => {
    let device1, debugger_;
    try {
      /***
       * Connect a device with one React Native page.
       */
      device1 = await createDeviceMock(
        `${serverRef.serverBaseWsUrl}/inspector/device?device=device1&name=foo&app=bar`,
        autoCleanup.signal,
      );
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-initial',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      let pageList;
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowIgnore[unclear-type]
        ): any);
        expect(pageList.length).toBeGreaterThan(0);
      });
      invariant(pageList != null, '');

      /***
       * The proxy reports *two* pages.
       */
      const syntheticPage = pageList.find(
        ({title}) =>
          // NOTE: Magic string used for the synthetic page that has a stable ID
          title === 'React Native Experimental (Improved Chrome Reloads)',
      );
      const originalPage = pageList.find(
        ({title}) => title === 'React Native (mock)',
      );
      expect(syntheticPage).not.toBeUndefined();
      expect(originalPage).not.toBeUndefined();
      expect(originalPage.id).toContain('originalPage-initial');
      expect(syntheticPage.id).not.toEqual(originalPage.id);

      // Connect to the synthetic page
      debugger_ = await createDebuggerMock(
        syntheticPage.webSocketDebuggerUrl,
        autoCleanup.signal,
      );

      device1.sendWrappedEvent('originalPage-initial', {
        error: 'Mock error',
      });

      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          error: 'Mock error',
        }),
      );

      /**
       * Replace our original page with a new one.
       */
      device1.getPages.mockImplementation(() => [
        {
          app: 'bar',
          id: 'originalPage-updated',
          // NOTE: 'React' is a magic string used to detect React Native pages.
          title: 'React Native (mock)',
          vm: 'vm',
        },
      ]);
      await until(async () => {
        pageList = (await fetchJson(
          `${serverRef.serverBaseUrl}/json`,
          // $FlowIgnore[unclear-type]
        ): any);
        expect(pageList).toContainEqual(
          expect.objectContaining({
            id: expect.stringContaining('originalPage-updated'),
          }),
        );
      });

      /**
       * We can reuse our existing debugger connection to the synthetic page.
       * Messages from the updated page will be routed to the debugger.
       */
      device1.sendWrappedEvent('originalPage-initial', {
        error: 'Another mock error',
      });

      await until(() =>
        expect(debugger_.handle).toBeCalledWith({
          error: 'Another mock error',
        }),
      );
    } finally {
      device1?.close();
      debugger_?.close();
    }
  });
});
