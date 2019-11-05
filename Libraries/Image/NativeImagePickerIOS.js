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

import {TurboModuleRegistry, type TurboModule} from 'react-native';

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +canRecordVideos: (callback: (result: boolean) => void) => void;
  +canUseCamera: (callback: (result: boolean) => void) => void;
  +openCameraDialog: (
    config: {|
      unmirrorFrontFacingCamera: boolean,
      videoMode: boolean,
    |},
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ) => void;
  +openSelectDialog: (
    config: {|
      showImages: boolean,
      showVideos: boolean,
    |},
    successCallback: (imageURL: string, height: number, width: number) => void,
    cancelCallback: () => void,
  ) => void;
  +clearAllPendingVideos: () => void;
  +removePendingVideo: (url: string) => void;
}

export default (TurboModuleRegistry.get<Spec>('ImagePickerIOS'): ?Spec);
