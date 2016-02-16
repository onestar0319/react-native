/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StatusBar
 * @flow
 */
'use strict';

const React = require('React');
const ColorPropType = require('ColorPropType');
const Platform = require('Platform');

const processColor = require('processColor');

const StatusBarManager = require('NativeModules').StatusBarManager;

export type StatusBarStyle = $Enum<{
  'default': string,
  'light-content': string,
}>;

export type StatusBarAnimation = $Enum<{
  'none': string,
  'fade': string,
  'slide': string,
}>;

type DefaultProps = {
  animated: boolean;
};

/**
 * Merges the prop stack with the default values.
 */
function mergePropsStack(propsStack: Array<Object>, defaultValues: Object): Object {
  return propsStack.reduce((prev, cur) => {
    return Object.assign(prev, cur);
  }, defaultValues);
}

/**
 * Component to control the app status bar.
 *
 * ### Usage with Navigator
 *
 * It is possible to have multiple `StatusBar` components mounted at the same
 * time. The props will be merged in the order the `StatusBar` components were
 * mounted. One use case is to specify status bar styles per route using `Navigator`.
 *
 * ```
 *  <View>
 *    <StatusBar
 *      backgroundColor="blue"
 *      barStyle="light-content"
 *    />
 *    <Navigator
 *      initialRoute={{statusBarHidden: true}}
 *      renderScene={(route, navigator) =>
 *        <View>
 *          <StatusBar hidden={route.statusBarHidden} />
 *          ...
 *        </View>
 *      }
 *    />
 *  </View>
 * ```
 *
 * ### Imperative API
 *
 * For cases where using a component is not ideal, there is also an imperative
 * API exposed as static functions on the component. It is however not recommended
 * to use the static API and the compoment for the same prop because any value
 * set by the static API will get overriden by the one set by the component in
 * the next render.
 */
const StatusBar = React.createClass({
  statics: {
    _propsStack: [],
    _defaultProps: {
      backgroundColor: 'black',
      barStyle: 'default',
      translucent: false,
      hidden: false,
      networkActivityIndicatorVisible: false,
    },

    // Provide an imperative API as static functions of the component.
    // See the corresponding prop for more detail.
    setHidden(hidden: boolean, animation?: StatusBarAnimation) {
      animation = animation || 'none';
      StatusBar._defaultProps.hidden = hidden;
      if (Platform.OS === 'ios') {
        StatusBarManager.setHidden(hidden, animation);
      } else if (Platform.OS === 'android') {
        StatusBarManager.setHidden(hidden);
      }
    },

    setBarStyle(style: StatusBarStyle, animated?: boolean) {
      if (Platform.OS !== 'ios') {
        console.warn('`setBarStyle` is only available on iOS');
        return;
      }
      animated = animated || false;
      StatusBar._defaultProps.barStyle = style;
      StatusBarManager.setStyle(style, animated);
    },

    setNetworkActivityIndicatorVisible(visible: boolean) {
      if (Platform.OS !== 'ios') {
        console.warn('`setNetworkActivityIndicatorVisible` is only available on iOS');
        return;
      }
      StatusBar._defaultProps.networkActivityIndicatorVisible = visible;
      StatusBarManager.setNetworkActivityIndicatorVisible(visible);
    },

    setBackgroundColor(color, animated?: boolean) {
      if (Platform.OS !== 'android') {
        console.warn('`setBackgroundColor` is only available on Android');
        return;
      }
      animated = animated || false;
      StatusBar._defaultProps.backgroundColor = color;
      StatusBarManager.setColor(processColor(color), animated);
    },

    setTranslucent(translucent: boolean) {
      if (Platform.OS !== 'android') {
        console.warn('`setTranslucent` is only available on Android');
        return;
      }
      StatusBar._defaultProps.translucent = translucent;
      StatusBarManager.setTranslucent(translucent);
    },
  },

  propTypes: {
    /**
     * If the status bar is hidden.
     */
    hidden: React.PropTypes.bool,
    /**
     * If the transition between status bar property changes should be animated.
     * Supported for backgroundColor, barStyle and hidden.
     */
    animated: React.PropTypes.bool,
    /**
     * The background color of the status bar.
     * @platform android
     */
    backgroundColor: ColorPropType,
    /**
     * If the status bar is translucent.
     * When translucent is set to true, the app will draw under the status bar.
     * This is useful when using a semi transparent status bar color.
     *
     * @platform android
     */
    translucent: React.PropTypes.bool,
    /**
     * Sets the color of the status bar text.
     *
     * @platform ios
     */
    barStyle: React.PropTypes.oneOf([
      'default',
      'light-content',
    ]),
    /**
     * If the network activity indicator should be visible.
     *
     * @platform ios
     */
    networkActivityIndicatorVisible: React.PropTypes.bool,
    /**
     * The transition effect when showing and hiding the status bar using the `hidden`
     * prop. Defaults to 'fade'.
     *
     * @platform ios
     */
    showHideTransition: React.PropTypes.oneOf([
      'fade',
      'slide',
    ]),
  },

  getDefaultProps(): DefaultProps {
    return {
      animated: false,
      showHideTransition: 'fade',
    };
  },

  componentDidMount() {
    // Every time a StatusBar component is mounted, we push it's prop to a stack
    // and always update the native status bar with the props from the top of then
    // stack. This allows having multiple StatusBar components and the one that is
    // added last or is deeper in the view hierachy will have priority.
    StatusBar._propsStack.push(this.props);
    this._updatePropsStack();
  },

  componentWillUnmount() {
    // When a StatusBar is unmounted, remove itself from the stack and update
    // the native bar with the next props.
    const index = StatusBar._propsStack.indexOf(this.props);
    StatusBar._propsStack.splice(index, 1);

    this._updatePropsStack();
  },

  componentDidUpdate(oldProps: Object) {
    const index = StatusBar._propsStack.indexOf(oldProps);
    StatusBar._propsStack[index] = this.props;

    this._updatePropsStack();
  },

  /**
   * Updates the native status bar with the props from the stack.
   */
  _updatePropsStack() {
    const mergedProps = mergePropsStack(StatusBar._propsStack, StatusBar._defaultProps);

    if (Platform.OS === 'ios') {
      if (mergedProps.barStyle !== undefined) {
        StatusBarManager.setStyle(mergedProps.barStyle, this.props.animated);
      }
      if (mergedProps.hidden !== undefined) {
        StatusBarManager.setHidden(
          mergedProps.hidden,
          this.props.animated ? this.props.showHideTransition : 'none'
        );
      }
      if (mergedProps.networkActivityIndicatorVisible !== undefined) {
        StatusBarManager.setNetworkActivityIndicatorVisible(
          mergedProps.networkActivityIndicatorVisible
        );
      }
    } else if (Platform.OS === 'android') {
      if (mergedProps.backgroundColor !== undefined) {
        StatusBarManager.setColor(processColor(mergedProps.backgroundColor), this.props.animated);
      }
      if (mergedProps.hidden !== undefined) {
        StatusBarManager.setHidden(mergedProps.hidden);
      }
      if (mergedProps.translucent !== undefined) {
        StatusBarManager.setTranslucent(mergedProps.translucent);
      }
    }
  },

  render(): ?ReactElement {
    return null;
  },
});

module.exports = StatusBar;
