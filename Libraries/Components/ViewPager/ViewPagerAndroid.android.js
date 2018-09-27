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

const DeprecatedViewPropTypes = require('DeprecatedViewPropTypes');
const PropTypes = require('prop-types');
const React = require('React');
const ReactNative = require('ReactNative');
const UIManager = require('UIManager');

const dismissKeyboard = require('dismissKeyboard');
const requireNativeComponent = require('requireNativeComponent');

const NativeAndroidViewPager = requireNativeComponent('AndroidViewPager');

const VIEWPAGER_REF = 'viewPager';

type Event = Object;

export type ViewPagerScrollState = $Enum<{
  idle: string,
  dragging: string,
  settling: string,
}>;

/**
 * Container that allows to flip left and right between child views. Each
 * child view of the `ViewPagerAndroid` will be treated as a separate page
 * and will be stretched to fill the `ViewPagerAndroid`.
 *
 * It is important all children are `<View>`s and not composite components.
 * You can set style properties like `padding` or `backgroundColor` for each
 * child. It is also important that each child have a `key` prop.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   return (
 *     <ViewPagerAndroid
 *       style={styles.viewPager}
 *       initialPage={0}>
 *       <View style={styles.pageStyle} key="1">
 *         <Text>First page</Text>
 *       </View>
 *       <View style={styles.pageStyle} key="2">
 *         <Text>Second page</Text>
 *       </View>
 *     </ViewPagerAndroid>
 *   );
 * }
 *
 * ...
 *
 * var styles = {
 *   ...
 *   viewPager: {
 *     flex: 1
 *   },
 *   pageStyle: {
 *     alignItems: 'center',
 *     padding: 20,
 *   }
 * }
 * ```
 */
class ViewPagerAndroid extends React.Component<{
  initialPage?: number,
  onPageScroll?: Function,
  onPageScrollStateChanged?: Function,
  onPageSelected?: Function,
  pageMargin?: number,
  peekEnabled?: boolean,
  keyboardDismissMode?: 'none' | 'on-drag',
  scrollEnabled?: boolean,
}> {
  /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
   * when making Flow check .android.js files. */
  static propTypes = {
    ...DeprecatedViewPropTypes,
    /**
     * Index of initial page that should be selected. Use `setPage` method to
     * update the page, and `onPageSelected` to monitor page changes
     */
    initialPage: PropTypes.number,

    /**
     * Executed when transitioning between pages (ether because of animation for
     * the requested page change or when user is swiping/dragging between pages)
     * The `event.nativeEvent` object for this callback will carry following data:
     *  - position - index of first page from the left that is currently visible
     *  - offset - value from range [0,1) describing stage between page transitions.
     *    Value x means that (1 - x) fraction of the page at "position" index is
     *    visible, and x fraction of the next page is visible.
     */
    onPageScroll: PropTypes.func,

    /**
     * Function called when the page scrolling state has changed.
     * The page scrolling state can be in 3 states:
     * - idle, meaning there is no interaction with the page scroller happening at the time
     * - dragging, meaning there is currently an interaction with the page scroller
     * - settling, meaning that there was an interaction with the page scroller, and the
     *   page scroller is now finishing it's closing or opening animation
     */
    onPageScrollStateChanged: PropTypes.func,

    /**
     * This callback will be called once ViewPager finish navigating to selected page
     * (when user swipes between pages). The `event.nativeEvent` object passed to this
     * callback will have following fields:
     *  - position - index of page that has been selected
     */
    onPageSelected: PropTypes.func,

    /**
     * Blank space to show between pages. This is only visible while scrolling, pages are still
     * edge-to-edge.
     */
    pageMargin: PropTypes.number,

    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'on-drag', the keyboard is dismissed when a drag begins.
     */
    keyboardDismissMode: PropTypes.oneOf([
      'none', // default
      'on-drag',
    ]),

    /**
     * When false, the content does not scroll.
     * The default value is true.
     */
    scrollEnabled: PropTypes.bool,

    /**
     * Whether enable showing peekFraction or not. If this is true, the preview of
     * last and next page will show in current screen. Defaults to false.
     */
    peekEnabled: PropTypes.bool,
  };

  componentDidMount() {
    if (this.props.initialPage != null) {
      this.setPageWithoutAnimation(this.props.initialPage);
    }
  }

  /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
   * when making Flow check .android.js files. */
  getInnerViewNode = (): ReactComponent => {
    return this.refs[VIEWPAGER_REF].getInnerViewNode();
  };

  /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
   * when making Flow check .android.js files. */
  _childrenWithOverridenStyle = (): Array => {
    // Override styles so that each page will fill the parent. Native component
    // will handle positioning of elements, so it's not important to offset
    // them correctly.
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    return React.Children.map(this.props.children, function(child) {
      if (!child) {
        return null;
      }
      const newProps = {
        ...child.props,
        style: [
          child.props.style,
          {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            width: undefined,
            height: undefined,
          },
        ],
        collapsable: false,
      };
      if (
        child.type &&
        child.type.displayName &&
        child.type.displayName !== 'RCTView' &&
        child.type.displayName !== 'View'
      ) {
        console.warn(
          'Each ViewPager child must be a <View>. Was ' +
            child.type.displayName,
        );
      }
      return React.createElement(child.type, newProps);
    });
  };

  _onPageScroll = (e: Event) => {
    if (this.props.onPageScroll) {
      this.props.onPageScroll(e);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  };

  _onPageScrollStateChanged = (e: Event) => {
    if (this.props.onPageScrollStateChanged) {
      this.props.onPageScrollStateChanged(e.nativeEvent.pageScrollState);
    }
  };

  _onPageSelected = (e: Event) => {
    if (this.props.onPageSelected) {
      this.props.onPageSelected(e);
    }
  };

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will be animated.
   */
  setPage = (selectedPage: number) => {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.getViewManagerConfig('AndroidViewPager').Commands.setPage,
      [selectedPage],
    );
  };

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will *not* be animated.
   */
  setPageWithoutAnimation = (selectedPage: number) => {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.getViewManagerConfig('AndroidViewPager').Commands
        .setPageWithoutAnimation,
      [selectedPage],
    );
  };

  render() {
    return (
      <NativeAndroidViewPager
        {...this.props}
        ref={VIEWPAGER_REF}
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */
        style={this.props.style}
        onPageScroll={this._onPageScroll}
        onPageScrollStateChanged={this._onPageScrollStateChanged}
        onPageSelected={this._onPageSelected}
        children={this._childrenWithOverridenStyle()}
      />
    );
  }
}

module.exports = ViewPagerAndroid;
