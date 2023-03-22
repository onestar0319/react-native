/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {
  AttributeConfiguration,
  HostComponent,
  INativeMethods,
  MeasureInWindowOnSuccessCallback,
  MeasureLayoutOnSuccessCallback,
  MeasureOnSuccessCallback,
  ViewConfig,
} from '../shims/ReactNativeTypes';
import type {ElementRef} from 'react';

import TextInputState from '../../Components/TextInput/TextInputState';
import {getFabricUIManager} from '../../ReactNative/FabricUIManager';
import {getNodeFromInternalInstanceHandle} from '../shims/ReactFabric';
import {create} from './ReactNativeAttributePayload';
import nullthrows from 'nullthrows';

const {
  measure: fabricMeasure,
  measureInWindow: fabricMeasureInWindow,
  measureLayout: fabricMeasureLayout,
  getBoundingClientRect: fabricGetBoundingClientRect,
  setNativeProps,
} = nullthrows(getFabricUIManager());

const noop = () => {};

/**
 * This is used for refs on host components.
 */
export class ReactFabricHostComponent implements INativeMethods {
  // These need to be accessible from `ReactFabricPublicInstanceUtils`.
  __nativeTag: number;
  __internalInstanceHandle: mixed;

  _viewConfig: ViewConfig;

  constructor(
    tag: number,
    viewConfig: ViewConfig,
    internalInstanceHandle: mixed,
  ) {
    this.__nativeTag = tag;
    this._viewConfig = viewConfig;
    this.__internalInstanceHandle = internalInstanceHandle;
  }

  blur() {
    // $FlowFixMe[incompatible-exact] Migrate all usages of `NativeMethods` to an interface to fix this.
    TextInputState.blurTextInput(this);
  }

  focus() {
    // $FlowFixMe[incompatible-exact] Migrate all usages of `NativeMethods` to an interface to fix this.
    TextInputState.focusTextInput(this);
  }

  measure(callback: MeasureOnSuccessCallback) {
    const node = getNodeFromInternalInstanceHandle(
      this.__internalInstanceHandle,
    );
    if (node != null) {
      fabricMeasure(node, callback);
    }
  }

  measureInWindow(callback: MeasureInWindowOnSuccessCallback) {
    const node = getNodeFromInternalInstanceHandle(
      this.__internalInstanceHandle,
    );
    if (node != null) {
      fabricMeasureInWindow(node, callback);
    }
  }

  measureLayout(
    relativeToNativeNode: number | ElementRef<HostComponent<mixed>>,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void /* currently unused */,
  ) {
    if (
      typeof relativeToNativeNode === 'number' ||
      !(relativeToNativeNode instanceof ReactFabricHostComponent)
    ) {
      if (__DEV__) {
        console.error(
          'Warning: ref.measureLayout must be called with a ref to a native component.',
        );
      }

      return;
    }

    const toStateNode = getNodeFromInternalInstanceHandle(
      this.__internalInstanceHandle,
    );
    const fromStateNode = getNodeFromInternalInstanceHandle(
      relativeToNativeNode.__internalInstanceHandle,
    );

    if (toStateNode != null && fromStateNode != null) {
      fabricMeasureLayout(
        toStateNode,
        fromStateNode,
        onFail != null ? onFail : noop,
        onSuccess != null ? onSuccess : noop,
      );
    }
  }

  unstable_getBoundingClientRect(): DOMRect {
    const node = getNodeFromInternalInstanceHandle(
      this.__internalInstanceHandle,
    );
    if (node != null) {
      const rect = fabricGetBoundingClientRect(node);

      if (rect) {
        return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
      }
    }

    // Empty rect if any of the above failed
    return new DOMRect(0, 0, 0, 0);
  }

  setNativeProps(nativeProps: {...}): void {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this._viewConfig.validAttributes);
    }
    const updatePayload = create(nativeProps, this._viewConfig.validAttributes);

    const node = getNodeFromInternalInstanceHandle(
      this.__internalInstanceHandle,
    );
    if (node != null && updatePayload != null) {
      setNativeProps(node, updatePayload);
    }
  }
}

export function warnForStyleProps(
  props: {...},
  validAttributes: AttributeConfiguration,
): void {
  if (__DEV__) {
    for (const key in validAttributes.style) {
      if (!(validAttributes[key] || props[key] === undefined)) {
        console.error(
          'You are setting the style `{ %s' +
            ': ... }` as a prop. You ' +
            'should nest it in a style object. ' +
            'E.g. `{ style: { %s' +
            ': ... } }`',
          key,
          key,
        );
      }
    }
  }
}

export function createPublicInstance(
  tag: number,
  viewConfig: ViewConfig,
  internalInstanceHandle: mixed,
): ReactFabricHostComponent {
  return new ReactFabricHostComponent(tag, viewConfig, internalInstanceHandle);
}

export function getNativeTagFromPublicInstance(
  publicInstance: ReactFabricHostComponent,
): number {
  return publicInstance.__nativeTag;
}

export function getNodeFromPublicInstance(
  publicInstance: ReactFabricHostComponent,
): mixed {
  return getNodeFromInternalInstanceHandle(
    publicInstance.__internalInstanceHandle,
  );
}
