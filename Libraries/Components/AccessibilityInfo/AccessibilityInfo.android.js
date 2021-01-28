/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import RCTDeviceEventEmitter from '../../EventEmitter/RCTDeviceEventEmitter';
import NativeAccessibilityInfo from './NativeAccessibilityInfo';
import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import {sendAccessibilityEvent} from '../../Renderer/shims/ReactNative';
import legacySendAccessibilityEvent from './legacySendAccessibilityEvent';
import {type ElementRef} from 'react';

const REDUCE_MOTION_EVENT = 'reduceMotionDidChange';
const TOUCH_EXPLORATION_EVENT = 'touchExplorationDidChange';

type AccessibilityEventDefinitions = {
  reduceMotionChanged: [boolean],
  screenReaderChanged: [boolean],
  // alias for screenReaderChanged
  change: [boolean],
};

type AccessibilityEventTypes = 'focus';

const _subscriptions = new Map();

/**
 * Sometimes it's useful to know whether or not the device has a screen reader
 * that is currently active. The `AccessibilityInfo` API is designed for this
 * purpose. You can use it to query the current state of the screen reader as
 * well as to register to be notified when the state of the screen reader
 * changes.
 *
 * See https://reactnative.dev/docs/accessibilityinfo.html
 */

const AccessibilityInfo = {
  /**
   * iOS only
   */
  isBoldTextEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * iOS only
   */
  isGrayscaleEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  /**
   * iOS only
   */
  isInvertColorsEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  isReduceMotionEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityInfo) {
        NativeAccessibilityInfo.isReduceMotionEnabled(resolve);
      } else {
        reject(false);
      }
    });
  },

  /**
   * iOS only
   */
  isReduceTransparencyEnabled: function(): Promise<boolean> {
    return Promise.resolve(false);
  },

  isScreenReaderEnabled: function(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (NativeAccessibilityInfo) {
        NativeAccessibilityInfo.isTouchExplorationEnabled(resolve);
      } else {
        reject(false);
      }
    });
  },

  /**
   * Deprecated
   *
   * Same as `isScreenReaderEnabled`
   */
  // $FlowFixMe[unsafe-getters-setters]
  get fetch(): () => Promise<boolean> {
    console.warn(
      'AccessibilityInfo.fetch is deprecated, call AccessibilityInfo.isScreenReaderEnabled instead',
    );
    return this.isScreenReaderEnabled;
  },

  addEventListener: function<K: $Keys<AccessibilityEventDefinitions>>(
    eventName: K,
    handler: (...$ElementType<AccessibilityEventDefinitions, K>) => void,
  ): EventSubscription {
    let listener;

    if (eventName === 'change' || eventName === 'screenReaderChanged') {
      listener = RCTDeviceEventEmitter.addListener(
        TOUCH_EXPLORATION_EVENT,
        handler,
      );
    } else if (eventName === 'reduceMotionChanged') {
      listener = RCTDeviceEventEmitter.addListener(
        REDUCE_MOTION_EVENT,
        handler,
      );
    }

    // $FlowFixMe[escaped-generic]
    _subscriptions.set(handler, listener);

    return {
      remove: () => {
        // $FlowIssue flow does not recognize handler properly
        AccessibilityInfo.removeEventListener<K>(eventName, handler);
      },
    };
  },

  removeEventListener: function<K: $Keys<AccessibilityEventDefinitions>>(
    eventName: K,
    handler: (...$ElementType<AccessibilityEventDefinitions, K>) => void,
  ): void {
    // $FlowFixMe[escaped-generic]
    const listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    // $FlowFixMe[escaped-generic]
    _subscriptions.delete(handler);
  },

  /**
   * Set accessibility focus to a react component.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#setaccessibilityfocus
   */
  setAccessibilityFocus: function(reactTag: number): void {
    legacySendAccessibilityEvent(reactTag, 'focus');
  },

  /**
   * Send a named accessibility event to a HostComponent.
   */
  sendAccessibilityEvent_unstable: function(
    handle: ElementRef<HostComponent<mixed>>,
    eventType: AccessibilityEventTypes,
  ) {
    // route through React renderer to distinguish between Fabric and non-Fabric handles
    sendAccessibilityEvent(handle, eventType);
  },

  /**
   * Post a string to be announced by the screen reader.
   *
   * See https://reactnative.dev/docs/accessibilityinfo.html#announceforaccessibility
   */
  announceForAccessibility: function(announcement: string): void {
    if (NativeAccessibilityInfo) {
      NativeAccessibilityInfo.announceForAccessibility(announcement);
    }
  },
};

module.exports = AccessibilityInfo;
