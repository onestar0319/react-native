/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import codegenNativeComponent from '../Utilities/codegenNativeComponent';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';
import type {
  WithDefault,
  DirectEventHandler,
  Int32,
} from '../Types/CodegenTypes';

import type {ViewProps} from '../Components/View/ViewPropTypes';

type OrientationChangeEvent = $ReadOnly<{|
  orientation: 'portrait' | 'landscape',
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * The `animationType` prop controls how the modal animates.
   *
   * See https://reactnative.dev/docs/modal#animationtype
   */
  animationType?: WithDefault<'none' | 'slide' | 'fade', 'none'>,

  /**
   * The `presentationStyle` prop controls how the modal appears.
   *
   * See https://reactnative.dev/docs/modal#presentationstyle
   */
  presentationStyle?: WithDefault<
    'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen',
    'fullScreen',
  >,

  /**
   * The `transparent` prop determines whether your modal will fill the
   * entire view.
   *
   * See https://reactnative.dev/docs/modal#transparent
   */
  transparent?: WithDefault<boolean, false>,

  /**
   * The `statusBarTranslucent` prop determines whether your modal should go under
   * the system statusbar.
   *
   * See https://reactnative.dev/docs/modal#statusBarTranslucent
   */
  statusBarTranslucent?: WithDefault<boolean, false>,

  /**
   * The `hardwareAccelerated` prop controls whether to force hardware
   * acceleration for the underlying window.
   *
   * See https://reactnative.dev/docs/modal#hardwareaccelerated
   */
  hardwareAccelerated?: WithDefault<boolean, false>,

  /**
   * The `onRequestClose` callback is called when the user taps the hardware
   * back button on Android or the menu button on Apple TV.
   *
   * This is required on Apple TV and Android.
   *
   * See https://reactnative.dev/docs/modal#onrequestclose
   */
  onRequestClose?: ?DirectEventHandler<null>,

  /**
   * The `onShow` prop allows passing a function that will be called once the
   * modal has been shown.
   *
   * See https://reactnative.dev/docs/modal#onshow
   */
  onShow?: ?DirectEventHandler<null>,

  /**
   * The `onDismiss` prop allows passing a function that will be called once
   * the modal has been dismissed.
   *
   * See https://reactnative.dev/docs/modal#ondismiss
   */
  onDismiss?: ?DirectEventHandler<null>,

  /**
   * The `visible` prop determines whether your modal is visible.
   *
   * See https://reactnative.dev/docs/modal#visible
   */
  visible?: WithDefault<boolean, false>,

  /**
   * Deprecated. Use the `animationType` prop instead.
   */
  animated?: WithDefault<boolean, false>,

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   *
   * See https://reactnative.dev/docs/modal#supportedorientations
   */
  supportedOrientations?: WithDefault<
    $ReadOnlyArray<
      | 'portrait'
      | 'portrait-upside-down'
      | 'landscape'
      | 'landscape-left'
      | 'landscape-right',
    >,
    'portrait',
  >,

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   *
   * See https://reactnative.dev/docs/modal#onorientationchange
   */
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,

  /**
   * The `identifier` is the unique number for identifying Modal components.
   */
  identifier?: WithDefault<Int32, 0>,
|}>;

export default (codegenNativeComponent<NativeProps>('ModalHostView', {
  interfaceOnly: true,
  paperComponentName: 'RCTModalHostView',
}): HostComponent<NativeProps>);
