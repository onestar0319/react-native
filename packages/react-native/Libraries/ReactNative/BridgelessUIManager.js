/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RootTag} from '../Types/RootTagTypes';
import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import {unstable_hasComponent} from '../NativeComponent/NativeComponentRegistryUnstable';
import Platform from '../Utilities/Platform';
import {getFabricUIManager} from './FabricUIManager';
import nullthrows from 'nullthrows';

function raiseSoftError(methodName: string, details?: string): void {
  console.error(
    `[ReactNative Architecture][JS] '${methodName}' is not available in the new React Native architecture.` +
      (details ? ` ${details}` : ''),
  );
}

const getUIManagerConstants: ?() => {[viewManagerName: string]: Object} =
  global.RN$LegacyInterop_UIManager_getConstants;

const getUIManagerConstantsCache = (function () {
  let wasCalledOnce = false;
  let result = {};
  return () => {
    if (!wasCalledOnce) {
      result = nullthrows(getUIManagerConstants)();
      wasCalledOnce = true;
    }
    return result;
  };
})();

/**
 * UIManager.js overrides these APIs.
 * Pull them out from the BridgelessUIManager implementation. So, we can ignore them.
 */
const UIManagerJSOverridenAPIs = {
  measure: (
    reactTag: ?number,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number,
    ) => void,
  ): void => {
    raiseSoftError('measure');
  },
  measureInWindow: (
    reactTag: ?number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ): void => {
    raiseSoftError('measureInWindow');
  },
  measureLayout: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('measureLayout');
  },
  measureLayoutRelativeToParent: (
    reactTag: ?number,
    errorCallback: (error: Object) => void,
    callback: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('measureLayoutRelativeToParent');
  },
  dispatchViewManagerCommand: (
    reactTag: ?number,
    commandID: number,
    commandArgs: ?Array<string | number | boolean>,
  ): void => {
    raiseSoftError('dispatchViewManagerCommand');
  },
};

/**
 * Leave Unimplemented: The only thing that called these methods was the paper renderer.
 * In OSS, the New Architecture will just use the Fabric renderer, which uses
 * different APIs.
 */
const UIManagerJSUnusedAPIs = {
  createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void => {
    raiseSoftError('createView');
  },
  updateView: (reactTag: number, viewName: string, props: Object): void => {
    raiseSoftError('updateView');
  },
  setChildren: (containerTag: ?number, reactTags: Array<number>): void => {
    raiseSoftError('setChildren');
  },
  manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ): void => {
    raiseSoftError('manageChildren');
  },
};

const UIManagerJSPlatformAPIs = Platform.select({
  android: {
    getConstantsForViewManager: (viewManagerName: string): Object => {
      raiseSoftError('getConstantsForViewManager');
      return {};
    },
    getDefaultEventTypes: (): Array<string> => {
      raiseSoftError('getDefaultEventTypes');
      return [];
    },
    setLayoutAnimationEnabledExperimental: (enabled: boolean): void => {
      /**
       * Layout animations are always enabled in the New Architecture.
       * They cannot be turned off.
       */
      if (!enabled) {
        raiseSoftError(
          'setLayoutAnimationEnabledExperimental(false)',
          'Layout animations are always enabled in the New Architecture.',
        );
      }
    },
    sendAccessibilityEvent: (reactTag: ?number, eventType: number): void => {
      if (reactTag == null) {
        console.error(
          `sendAccessibilityEvent() dropping event: Cannot be called with ${String(
            reactTag,
          )} reactTag`,
        );
        return;
      }

      // Keep this in sync with java:FabricUIManager.sendAccessibilityEventFromJS
      // and legacySendAccessibilityEvent.android.js
      const AccessibilityEvent = {
        TYPE_VIEW_FOCUSED: 0x00000008,
        TYPE_WINDOW_STATE_CHANGED: 0x00000020,
        TYPE_VIEW_CLICKED: 0x00000001,
        TYPE_VIEW_HOVER_ENTER: 0x00000080,
      };

      let eventName = null;
      if (eventType === AccessibilityEvent.TYPE_VIEW_FOCUSED) {
        eventName = 'focus';
      } else if (eventType === AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
        eventName = 'windowStateChange';
      } else if (eventType === AccessibilityEvent.TYPE_VIEW_CLICKED) {
        eventName = 'click';
      } else if (eventType === AccessibilityEvent.TYPE_VIEW_HOVER_ENTER) {
        eventName = 'viewHoverEnter';
      } else {
        console.error(
          `sendAccessibilityEvent() dropping event: Called with unsupported eventType: ${eventType}`,
        );
        return;
      }

      const FabricUIManager = nullthrows(getFabricUIManager());
      const shadowNode =
        FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (!shadowNode) {
        console.error(
          `sendAccessibilityEvent() dropping event: Cannot find view with tag #${reactTag}`,
        );
        return;
      }

      FabricUIManager.sendAccessibilityEvent(shadowNode, eventName);
    },
    showPopupMenu: (
      reactTag: ?number,
      items: Array<string>,
      error: (error: Object) => void,
      success: (event: string, selected?: number) => void,
    ): void => {
      raiseSoftError('showPopupMenu');
    },
    dismissPopupMenu: (): void => {
      raiseSoftError('dismissPopupMenu');
    },
  },
  ios: {
    lazilyLoadView: (name: string): Object => {
      raiseSoftError('lazilyLoadView');
      return {};
    },
    focus: (reactTag: ?number): void => {
      raiseSoftError('focus');
    },
    blur: (reactTag: ?number): void => {
      raiseSoftError('blur');
    },
  },
});

const UIManagerJS: UIManagerJSInterface & {[string]: any} = {
  ...UIManagerJSOverridenAPIs,
  ...UIManagerJSPlatformAPIs,
  ...UIManagerJSUnusedAPIs,
  getViewManagerConfig: (viewManagerName: string): mixed => {
    if (getUIManagerConstants) {
      return getUIManagerConstantsCache()[viewManagerName];
    } else {
      raiseSoftError(
        `getViewManagerConfig('${viewManagerName}')`,
        `If '${viewManagerName}' has a ViewManager and you want to retrieve its native ViewConfig, please turn on the native ViewConfig interop layer. If you want to see if this component is registered with React Native, please call hasViewManagerConfig('${viewManagerName}') instead.`,
      );
      return null;
    }
  },
  hasViewManagerConfig: (viewManagerName: string): boolean => {
    return unstable_hasComponent(viewManagerName);
  },
  getConstants: (): Object => {
    if (getUIManagerConstants) {
      return getUIManagerConstantsCache();
    } else {
      raiseSoftError('getConstants');
      return null;
    }
  },
  findSubviewIn: (
    reactTag: ?number,
    point: Array<number>,
    callback: (
      nativeViewTag: number,
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ): void => {
    raiseSoftError('findSubviewIn');
  },
  viewIsDescendantOf: (
    reactTag: ?number,
    ancestorReactTag: ?number,
    callback: (result: Array<boolean>) => void,
  ): void => {
    raiseSoftError('viewIsDescendantOf');
  },
  setJSResponder: (reactTag: ?number, blockNativeResponder: boolean): void => {
    raiseSoftError('setJSResponder');
  },
  clearJSResponder: (): void => {
    // Don't log error here because we're aware it gets called
  },
  configureNextLayoutAnimation: (
    config: Object,
    callback: () => void,
    errorCallback: (error: Object) => void,
  ): void => {
    const FabricUIManager = nullthrows(getFabricUIManager());
    FabricUIManager.configureNextLayoutAnimation(
      config,
      callback,
      errorCallback,
    );
  },
};

if (getUIManagerConstants) {
  Object.keys(getUIManagerConstantsCache()).forEach(viewConfigName => {
    UIManagerJS[viewConfigName] = getUIManagerConstantsCache()[viewConfigName];
  });
}

module.exports = UIManagerJS;
