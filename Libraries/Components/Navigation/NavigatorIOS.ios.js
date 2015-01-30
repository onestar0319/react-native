/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigatorIOS
 */
'use strict';

var EventEmitter = require('EventEmitter');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var { RKUIManager } = require('NativeModules');
var StyleSheet = require('StyleSheet');
var StaticContainer = require('StaticContainer.react');
var View = require('View');

var createReactIOSNativeComponentClass =
  require('createReactIOSNativeComponentClass');
var invariant = require('invariant');
var logError = require('logError');
var merge = require('merge');

/**
 * NavigatorIOS wraps UIKit navigation and allows you to add back-swipe
 * functionality across your app.
 *
 * See UIExplorerApp and NavigatorIOSExample for a full example
 *
 * ======================= NavigatorIOS Routes ================================
 * A route is an object used to describe each page in the navigator. The first
 * route is provided to NavigatorIOS as `initialRoute`:
 *
 * ```
 * render: function() {
 *   return (
 *     <NavigatorIOS
 *       initialRoute={{
 *         component: MyView,
 *         title: 'My View Title',
 *         passProps: { myProp: 'foo' },
 *       }}/>
 *   );
 * },
 * ```
 *
 * Now MyView will be rendered by the navigator. It will recieve the route
 * object in the `route` prop, a navigator, and all of the props specified in
 * `passProps`.
 *
 * See the initialRoute propType for a complete definition of a route.
 *
 * ====================== NavigatorIOS Navigator ==============================
 * A `navigator` is an object of navigation functions that a view can call. It
 * is passed as a prop to any component rendered by NavigatorIOS.
 *
 * ```
 * var MyView = React.createClass({
 *   _handleBackButtonPress: function() {
 *     this.props.navigator.pop();
 *   },
 *   _handleNextButtonPress: function() {
 *     this.props.navigator.push(nextRoute);
 *   },
 *   ...
 * });
 * ```
 *
 * A navigation object contains the following functions:
 *  - `push(route)` - Navigate forward to a new route
 *  - `pop()` - Go back one page
 *  - `popN(n)` - Go back N pages at once. When N=1, behavior matches `pop()`
 *  - `replace(route)` - Replace the route for the current page and immediately
 *    load the view for the new route
 *  - `replacePrevious(route)` - Replace the route/view for the previous page
 *  - `replacePreviousAndPop(route)` - Replaces the previous route/view and
 *    transitions back to it
 *  - `resetTo(route)` - Replaces the top item and popToTop
 *  - `popToRoute(route)` - Go back to the item for a particular route object
 *  - `popToTop()` - Go back to the top item
 *
 * Navigator functions are also available on the NavigatorIOS component:
 *
 * ```
 * var MyView = React.createClass({
 *   _handleNavigationRequest: function() {
 *     this.refs.nav.push(otherRoute);
 *   },
 *   render: () => (
 *     <NavigatorIOS
 *       ref='nav',
 *       initialRoute={...}/>
 *   ),
 * });
 * ```
 *
 */
var TRANSITIONER_REF = 'transitionerRef';

var PropTypes = React.PropTypes;

var __uid = 0;
function getuid() {
  return __uid++;
}

var RKNavigator = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView, {
    requestedTopOfStack: true
  }),
  uiViewClassName: 'RCTNavigator',
});

var RKNavigatorItem = createReactIOSNativeComponentClass({
  validAttributes: {
    // TODO: Remove or fix the attributes that are not fully functional.
    //  NavigatorIOS does not use them all, because some are problematic
    title: true,
    barTintColor: true,
    rightButtonTitle: true,
    onNavRightButtonTap: true,
    tintColor: true,
    backButtonTitle: true,
    titleTextColor: true,
    style: true,
  },
  uiViewClassName: 'RCTNavItem',
});

var NavigatorTransitionerIOS = React.createClass({
  requestSchedulingNavigation: function(cb) {
    RKUIManager.requestSchedulingJavaScriptNavigation(
      this.getNodeHandle(),
      logError,
      cb
    );
  },

  render: function() {
    return (
      <RKNavigator {...this.props}/>
    );
  },
});


/**
 * Think of `<NavigatorIOS>` as simply a component that renders an
 * `RKNavigator`, and moves the `RKNavigator`'s `requestedTopOfStack` pointer
 * forward and backward. The `RKNavigator` interprets changes in
 * `requestedTopOfStack` to be pushes and pops of children that are rendered.
 * `<NavigatorIOS>` always ensures that whenever the `requestedTopOfStack`
 * pointer is moved, that we've also rendered enough children so that the
 * `RKNavigator` can carry out the push/pop with those children.
 * `<NavigatorIOS>` also removes children that will no longer be needed
 * (after the pop of a child has been fully completed/animated out).
 */
var NavigatorIOS = React.createClass({

  propTypes: {

    /**
     * NavigatorIOS uses "route" objects to identify child views, their props,
     * and navigation bar configuration. "push" and all the other navigation
     * operations expect routes to be like this:
     */
    initialRoute: PropTypes.shape({
      /**
       * The React Class to render for this route
       */
      component: PropTypes.func.isRequired,

      /**
       * The title displayed in the nav bar and back button for this route
       */
      title: PropTypes.string.isRequired,

      /**
       * Specify additional props passed to the component. NavigatorIOS will
       * automatically provide "route" and "navigator" components
       */
      passProps: PropTypes.object,

      /**
       * If set, the right header button will appear with this name
       */
      rightButtonTitle: PropTypes.string,

      /**
       * Called when the right header button is pressed
       */
      onRightButtonPress: PropTypes.func,

      /**
       * Styles for the navigation item containing the component
       */
      wrapperStyle: View.stylePropType,

    }).isRequired,

    /**
     * The default wrapper style for components in the navigator.
     * A common use case is to set the backgroundColor for every page
     */
    itemWrapperStyle: View.stylePropType,

    /**
     * The color used for buttons in the navigation bar
     */
    tintColor: PropTypes.string,

  },

  componentWillMount: function() {
    // Precompute a pack of callbacks that's frequently generated and passed to
    // instances.
    this.navigator = {
      push: this.push,
      pop: this.pop,
      popN: this.popN,
      replace: this.replace,
      replacePrevious: this.replacePrevious,
      replacePreviousAndPop: this.replacePreviousAndPop,
      resetTo: this.resetTo,
      popToRoute: this.popToRoute,
      popToTop: this.popToTop,
    };
  },

  getInitialState: function() {
    return {
      idStack: [getuid()],
      routeStack: [this.props.initialRoute],
      // The navigation index that we wish to push/pop to.
      requestedTopOfStack: 0,
      // The last index that native has sent confirmation of completed push/pop
      // for. At this point, we can discard any views that are beyond the
      // `requestedTopOfStack`. A value of `null` means we have not received
      // any confirmation, ever. We may receive an `observedTopOfStack` without
      // ever requesting it - native can instigate pops of its own with the
      // backswipe gesture.
      observedTopOfStack: 0,
      progress: 1,
      fromIndex: 0,
      toIndex: 0,
      // Whether or not we are making a navigator request to push/pop. (Used
      // for performance optimization).
      makingNavigatorRequest: false,
      // Whether or not we are updating children of navigator and if so (not
      // `null`) which index marks the beginning of all updates. Used for
      // performance optimization.
      updatingAllIndicesAtOrBeyond: 0,
    };
  },

  _handleFocusRequest: function(item) {
    if (this.state.makingNavigatorRequest) {
      this._toFocusOnNavigationComplete = item;
    } else {
      this._getFocusEmitter().emit('focus', item);
    }
  },

  _getFocusEmitter: function() {
    if (!this._focusEmitter) {
      this._focusEmitter = new EventEmitter();
    }
    return this._focusEmitter;
  },

  getChildContext: function() {
    return {
      onFocusRequested: this._handleFocusRequest,
      focusEmitter: this._getFocusEmitter(),
    };
  },

  childContextTypes: {
    onFocusRequested: React.PropTypes.func,
    focusEmitter: React.PropTypes.instanceOf(EventEmitter),
  },

  _tryLockNavigator: function(cb) {
    this.refs[TRANSITIONER_REF].requestSchedulingNavigation(
      (acquiredLock) => acquiredLock && cb()
    );
  },

  _handleNavigatorStackChanged: function(e) {
    var newObservedTopOfStack = e.nativeEvent.stackLength - 1;
    invariant(
      newObservedTopOfStack <= this.state.requestedTopOfStack,
      'No navigator item should be pushed without JS knowing about it %s %s', newObservedTopOfStack, this.state.requestedTopOfStack
    );
    var wasWaitingForConfirmation =
      this.state.requestedTopOfStack !== this.state.observedTopOfStack;
    if (wasWaitingForConfirmation) {
      invariant(
        newObservedTopOfStack === this.state.requestedTopOfStack,
        'If waiting for observedTopOfStack to reach requestedTopOfStack, ' +
        'the only valid observedTopOfStack should be requestedTopOfStack.'
      );
    }
    // Mark the most recent observation regardless of if we can lock the
    // navigator. `observedTopOfStack` merely represents what we've observed
    // and this first `setState` is only executed to update debugging
    // overlays/navigation bar.
    // Also reset progress, toIndex, and fromIndex as they might not end
    // in the correct states for a two possible reasons:
    // Progress isn't always 0 or 1 at the end, the system rounds
    // If the Navigator is offscreen these values won't be updated
    // TOOD: Revisit this decision when no longer relying on native navigator.
    var nextState = {
      observedTopOfStack: newObservedTopOfStack,
      makingNavigatorRequest: false,
      updatingAllIndicesAtOrBeyond: null,
      progress: 1,
      toIndex: newObservedTopOfStack,
      fromIndex: newObservedTopOfStack,
    };
    this.setState(nextState, this._eliminateUnneededChildren);
  },

  _eliminateUnneededChildren: function() {
    // Updating the indices that we're deleting and that's all. (Truth: Nothing
    // even uses the indices in this case, but let's make this describe the
    // truth anyways).
    var updatingAllIndicesAtOrBeyond =
      this.state.routeStack.length > this.state.observedTopOfStack + 1 ?
      this.state.observedTopOfStack + 1 :
      null;
    this.setState({
      idStack: this.state.idStack.slice(0, this.state.observedTopOfStack + 1),
      routeStack: this.state.routeStack.slice(0, this.state.observedTopOfStack + 1),
      // Now we rerequest the top of stack that we observed.
      requestedTopOfStack: this.state.observedTopOfStack,
      makingNavigatorRequest: true,
      updatingAllIndicesAtOrBeyond: updatingAllIndicesAtOrBeyond,
    });
  },

  push: function(route) {
    invariant(!!route, 'Must supply route to push');
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack === this.state.observedTopOfStack) {
      this._tryLockNavigator(() => {
        var nextStack = this.state.routeStack.concat([route]);
        var nextIDStack = this.state.idStack.concat([getuid()]);
        this.setState({
          // We have to make sure that we've also supplied enough views to
          // satisfy our request to adjust the `requestedTopOfStack`.
          idStack: nextIDStack,
          routeStack: nextStack,
          requestedTopOfStack: nextStack.length - 1,
          makingNavigatorRequest: true,
          updatingAllIndicesAtOrBeyond: nextStack.length - 1,
        });
      });
    }
  },

  popN: function(n) {
    if (n === 0) {
      return;
    }
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack === this.state.observedTopOfStack) {
      if (this.state.requestedTopOfStack > 0) {
        this._tryLockNavigator(() => {
          invariant(
            this.state.requestedTopOfStack - n >= 0,
            'Cannot pop below 0'
          );
          this.setState({
            requestedTopOfStack: this.state.requestedTopOfStack - n,
            makingNavigatorRequest: true,
            // Not actually updating the indices yet until we get the native
            // `onNavigationComplete`.
            updatingAllIndicesAtOrBeyond: null,
          });
        });
      }
    }
  },

  pop: function() {
    this.popN(1);
  },

  /**
   * Replace a route in the navigation stack.
   *
   * `index` specifies the route in the stack that should be replaced.
   * If it's negative, it counts from the back.
   */
  replaceAtIndex: function(route, index) {
    invariant(!!route, 'Must supply route to replace');
    if (index < 0) {
      index += this.state.routeStack.length;
    }

    if (this.state.routeStack.length <= index) {
      return;
    }

    // I don't believe we need to lock for a replace since there's no
    // navigation actually happening
    var nextIDStack = this.state.idStack.slice();
    var nextRouteStack = this.state.routeStack.slice();
    nextIDStack[index] = getuid();
    nextRouteStack[index] = route;

    this.setState({
      idStack: nextIDStack,
      routeStack: nextRouteStack,
      makingNavigatorRequest: false,
      updatingAllIndicesAtOrBeyond: index,
    });
  },

  /**
   * Replaces the top of the navigation stack.
   */
  replace: function(route) {
    this.replaceAtIndex(route, -1);
  },

  /**
   * Replace the current route's parent.
   */
  replacePrevious: function(route) {
    this.replaceAtIndex(route, -2);
  },

  popToTop: function() {
    this.popToRoute(this.state.routeStack[0]);
  },

  popToRoute: function(route) {
    var indexOfRoute = this.state.routeStack.indexOf(route);
    invariant(
      indexOfRoute !== -1,
      'Calling pop to route for a route that doesn\'t exist!'
    );
    var numToPop = this.state.routeStack.length - indexOfRoute - 1;
    this.popN(numToPop);
  },

  replacePreviousAndPop: function(route) {
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack !== this.state.observedTopOfStack) {
      return;
    }
    if (this.state.routeStack.length < 2) {
      return;
    }
    this._tryLockNavigator(() => {
      this.replacePrevious(route);
      this.setState({
        requestedTopOfStack: this.state.requestedTopOfStack - 1,
        makingNavigatorRequest: true,
      });
    });
  },

  resetTo: function(route) {
    invariant(!!route, 'Must supply route to push');
    // Make sure all previous requests are caught up first. Otherwise reject.
    if (this.state.requestedTopOfStack !== this.state.observedTopOfStack) {
      return;
    }
    this.replaceAtIndex(route, 0);
    this.popToRoute(route);
  },

  handleNavigationComplete: function(e) {
    if (this._toFocusOnNavigationComplete) {
      this._getFocusEmitter().emit('focus', this._toFocusOnNavigationComplete);
      this._toFocusOnNavigationComplete = null;
    }
    this._handleNavigatorStackChanged(e);
  },

  _routeToStackItem: function(route, i) {
    var Component = route.component;
    var shouldUpdateChild = this.state.updatingAllIndicesAtOrBeyond !== null &&
      this.state.updatingAllIndicesAtOrBeyond >= i;

    return (
      <StaticContainer key={'nav' + i} shouldUpdate={shouldUpdateChild}>
        <RKNavigatorItem
          title={route.title}
          style={[
            styles.stackItem,
            this.props.itemWrapperStyle,
            route.wrapperStyle
          ]}
          rightButtonTitle={route.rightButtonTitle}
          onNavRightButtonTap={route.onRightButtonPress}
          tintColor={this.props.tintColor}>
          <Component
            navigator={this.navigator}
            route={route}
            {...route.passProps}
          />
        </RKNavigatorItem>
      </StaticContainer>
    );
  },

  renderNavigationStackItems: function() {
    var shouldRecurseToNavigator =
      this.state.makingNavigatorRequest ||
      this.state.updatingAllIndicesAtOrBeyond !== null;
    // If not recursing update to navigator at all, may as well avoid
    // computation of navigator children.
    var items = shouldRecurseToNavigator ?
      this.state.routeStack.map(this._routeToStackItem) : null;
    return (
      <StaticContainer shouldUpdate={shouldRecurseToNavigator}>
        <NavigatorTransitionerIOS
          ref={TRANSITIONER_REF}
          style={styles.transitioner}
          vertical={this.props.vertical}
          requestedTopOfStack={this.state.requestedTopOfStack}
          onNavigationComplete={this.handleNavigationComplete}>
          {items}
        </NavigatorTransitionerIOS>
      </StaticContainer>
    );
  },

  render: function() {
    return (
      <View style={this.props.style}>
        {this.renderNavigationStackItems()}
      </View>
    );
  }
});

var styles = StyleSheet.create({
  stackItem: {
    backgroundColor: 'white',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  transitioner: {
    flex: 1,
  },
});

module.exports = NavigatorIOS;
