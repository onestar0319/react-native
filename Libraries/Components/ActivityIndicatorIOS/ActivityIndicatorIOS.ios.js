/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ActivityIndicatorIOS
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');
var verifyPropTypes = require('verifyPropTypes');

var GRAY = '#999999';

type DefaultProps = {
  animating: boolean;
  color: string;
  hidesWhenStopped: boolean;
  size: 'small' | 'large';
};

var ActivityIndicatorIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * Whether to show the indicator (true, the default) or hide it (false).
     */
    animating: PropTypes.bool,
    /**
     * The foreground color of the spinner (default is gray).
     */
    color: PropTypes.string,
    /**
     * Whether the indicator should hide when not animating (true by default).
     */
    hidesWhenStopped: PropTypes.bool,
    /**
     * Size of the indicator. Small has a height of 20, large has a height of 36.
     */
    size: PropTypes.oneOf([
      'small',
      'large',
    ]),
  },

  getDefaultProps: function(): DefaultProps {
    return {
      animating: true,
      color: GRAY,
      hidesWhenStopped: true,
      size: 'small',
    };
  },

  render: function() {
    var {style, ...props} = this.props;
    var sizeStyle = (this.props.size === 'large') ? styles.sizeLarge : styles.sizeSmall;
    return (
      <View style={[styles.container, sizeStyle, style]}>
        <RCTActivityIndicatorView {...props} />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    height: 20,
  },
  sizeLarge: {
    height: 36,
  }
});

var RCTActivityIndicatorView = requireNativeComponent(
  'RCTActivityIndicatorView',
  null
);
if (__DEV__) {
  var nativeOnlyProps = {activityIndicatorViewStyle: true};
  verifyPropTypes(
    ActivityIndicatorIOS,
    RCTActivityIndicatorView.viewConfig,
    nativeOnlyProps
  );
}

module.exports = ActivityIndicatorIOS;
