/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const TextAncestor = require('TextAncestor');
const ViewPropTypes = require('ViewPropTypes');

const invariant = require('fbjs/lib/invariant');
const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see http://facebook.github.io/react-native/docs/view.html
 */
class View extends ReactNative.NativeComponent<Props> {
  static propTypes = ViewPropTypes;

  viewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  };

  /**
   * WARNING: This method will not be used in production mode as in that mode we
   * replace wrapper component View with generated native wrapper RCTView. Avoid
   * adding functionality this component that you'd want to be available in both
   * dev and prod modes.
   */
  render() {
    return (
      <TextAncestor.Consumer>
        {hasTextAncestor => {
          // TODO: Change iOS to behave the same as Android.
          invariant(
            !hasTextAncestor || Platform.OS !== 'android',
            'Nesting of <View> within <Text> is not supported on Android.',
          );
          return <RCTView {...this.props} />;
        }}
      </TextAncestor.Consumer>
    );
  }
}

const RCTView = requireNativeComponent('RCTView', View, {
  nativeOnly: {
    nativeBackgroundAndroid: true,
    nativeForegroundAndroid: true,
  },
});

if (__DEV__) {
  const UIManager = require('UIManager');
  const viewConfig =
    (UIManager.viewConfigs && UIManager.viewConfigs.RCTView) || {};
  for (const prop in viewConfig.nativeProps) {
    const viewAny: any = View; // Appease flow
    if (!viewAny.propTypes[prop] && !ReactNativeStyleAttributes[prop]) {
      throw new Error(
        'View is missing propType for native prop `' + prop + '`',
      );
    }
  }
}

let ViewToExport = RCTView;
if (__DEV__) {
  ViewToExport = View;
}

// No one should depend on the DEV-mode createClass View wrapper.
module.exports = ((ViewToExport: any): typeof View);
