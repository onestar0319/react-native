/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import UIManagerInjection from './UIManagerInjection';
import type {Spec} from './NativeUIManager';

interface UIManagerJSInterface extends Spec {
  +getViewManagerConfig: (viewManagerName: string) => Object;
  +hasViewManagerConfig: (viewManagerName: string) => boolean;
  +createView: (
    reactTag: ?number,
    viewName: string,
    rootTag: number,
    props: Object,
  ) => void;
  +updateView: (reactTag: number, viewName: string, props: Object) => void;
  +manageChildren: (
    containerTag: ?number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;
}

const UIManager: UIManagerJSInterface =
  global.RN$Bridgeless === true
    ? require('./DummyUIManager') // No UIManager in bridgeless mode
    : UIManagerInjection.unstable_UIManager == null
    ? require('./PaperUIManager')
    : UIManagerInjection.unstable_UIManager;

module.exports = UIManager;
