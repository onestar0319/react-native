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

const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const requireNativeComponent = require('requireNativeComponent');

import type {NativeComponent} from 'ReactNative';
import type {ViewProps} from 'ViewPropTypes';

const RCTActivityIndicator =
  Platform.OS === 'android'
    ? require('ProgressBarAndroid')
    : requireNativeComponent('RCTActivityIndicatorView');

const GRAY = '#999999';

type IndicatorSize = number | 'small' | 'large';

type IOSProps = $ReadOnly<{|
  /**
   * Whether the indicator should hide when not animating (true by default).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#hideswhenstopped
   */
  hidesWhenStopped?: ?boolean,
|}>;
type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,

  /**
   * Whether to show the indicator (true, the default) or hide it (false).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#animating
   */
  animating?: ?boolean,

  /**
   * The foreground color of the spinner (default is gray).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#color
   */
  color?: ?string,

  /**
   * Size of the indicator (default is 'small').
   * Passing a number to the size prop is only supported on Android.
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#size
   */
  size?: ?IndicatorSize,
|}>;

/**
 * Displays a circular loading indicator.
 *
 * See http://facebook.github.io/react-native/docs/activityindicator.html
 */
const ActivityIndicator = (
  props: Props,
  forwardedRef?: ?React.Ref<'RCTActivityIndicatorView'>,
) => {
  const {onLayout, style, ...restProps} = props;
  let sizeStyle;

  switch (props.size) {
    case 'small':
      sizeStyle = styles.sizeSmall;
      break;
    case 'large':
      sizeStyle = styles.sizeLarge;
      break;
    default:
      sizeStyle = {height: props.size, width: props.size};
      break;
  }

  const nativeProps = {
    ...restProps,
    ref: forwardedRef,
    style: sizeStyle,
    styleAttr: 'Normal',
    indeterminate: true,
  };

  return (
    <View
      onLayout={onLayout}
      style={StyleSheet.compose(
        styles.container,
        style,
      )}>
      {/* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
        * found when making Flow check .android.js files. */}
      <RCTActivityIndicator {...nativeProps} />
    </View>
  );
};

// $FlowFixMe - TODO T29156721 `React.forwardRef` is not defined in Flow, yet.
const ActivityIndicatorWithRef = React.forwardRef(ActivityIndicator);

ActivityIndicatorWithRef.defaultProps = {
  animating: true,
  color: Platform.OS === 'ios' ? GRAY : null,
  hidesWhenStopped: true,
  size: 'small',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    width: 20,
    height: 20,
  },
  sizeLarge: {
    width: 36,
    height: 36,
  },
});

module.exports = (ActivityIndicatorWithRef: Class<NativeComponent<Props>>);
