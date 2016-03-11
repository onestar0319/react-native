/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigationLegacyNavigator
 * @flow
 */
'use strict';

const NavigationAnimatedValueSubscription = require('NavigationAnimatedValueSubscription');
const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationContext = require('NavigationContext');
const NavigationLegacyNavigatorRouteStack = require('NavigationLegacyNavigatorRouteStack');
const NavigatorBreadcrumbNavigationBar = require('NavigatorBreadcrumbNavigationBar');
const NavigatorNavigationBar = require('NavigatorNavigationBar');
const NavigatorSceneConfigs = require('NavigatorSceneConfigs');
const React = require('react-native');
const ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');

const invariant = require('fbjs/lib/invariant');
const guid = require('guid');

import type  {
  NavigationSceneRenderer,
  NavigationSceneRendererProps,
} from 'NavigationTypeDefinition';

type Props = {
  configureScene: any,
  initialRoute: any,
  initialRouteStack: any,
  renderScene: any,
  navigationBar: any,
  navigationBarNavigator: any,
  renderScene: any,
  style: any,
};

type State = {
  presentedIndex: number,
  routeStack: Array<any>,
};

function getConfigPopDirection(config: any): ?string {
  if (config && config.gestures && config.gestures.pop) {
    const direction = config.gestures.pop.direction;
    return direction ? String(direction) : null;
  }

  return null;
}

const RouteStack = NavigationLegacyNavigatorRouteStack;

/**
 * NavigationLegacyNavigator is meant to replace Navigator seemlessly with
 * minimum API changes.
 *
 * While the APIs remain compatible with Navigator, it is built with good
 * intention by using the new Navigation API such as
 * `NavigationAnimatedView`...etc.
 */
class NavigationLegacyNavigator extends React.Component<any, Props, State> {
  static BreadcrumbNavigationBar: any;
  static NavigationBar: any;
  static SceneConfigs: any;

  _key: string;
  _navigationBarRef: any;
  _onNavigationBarRef: (ref: any) => void;
  _onPositionChange: (data: {value: number}) => void;
  _positionListener: ?NavigationAnimatedValueSubscription;
  _previousStack: NavigationLegacyNavigatorRouteStack;
  _renderCard: NavigationSceneRenderer;
  _renderHeader: NavigationSceneRenderer;
  _renderScene: NavigationSceneRenderer;
  _stack: NavigationLegacyNavigatorRouteStack;

  navigationContext: NavigationContext;
  props: Props;
  state: State;

  constructor(props: Props, context: any) {
    super(props, context);

    this.navigationContext = new NavigationContext();

    const stack = this._getInitialRouteStack();

    // Unfortunately, due to historical reasons, the `state` has been exposed
    // as public members of the navigator, therefore we'd keep private state
    // as private members.
    this._key = guid();
    this._previousStack = stack;
    this._stack = stack;

    this.state = {
      routeStack: stack.toArray(),
      presentedIndex: stack.index,
    };
  }

  jumpTo(route: any): void {
    const index = this._stack.indexOf(route);
    invariant(
      index > -1,
      'Cannot jump to route that is not in the route stack'
    );
    this._jumpToIndex(index);
  }

  jumpForward(): void {
    this._jumpToIndex(this._stack.index + 1);
  }

  jumpBack(): void {
    this._jumpToIndex(this._stack.index - 1);
  }

  push(route: any): void {
    this._applyStack(this._stack.push(route));
  }

  pop(): void {
    const stack = this._stack;
    if (stack.size > 1) {
      this._applyStack(stack.pop());
    }
  }

  replaceAtIndex(route: any, index: number): void {
    const stack = this._stack;

    if (index < 0) {
      index += stack.size;
    }

    if (index >= stack.size) {
      // Nothing to replace.
      return;
    }

    this._applyStack(stack.replaceAtIndex(index, route));
  }

  replace(route: any): void {
    this.replaceAtIndex(route, this._stack.index);
  }

  replacePrevious(route: any): void {
    this.replaceAtIndex(route, this._stack.index - 1);
  }

  popToTop(): void {
    this._applyStack(this._stack.slice(0, 1));
  }

  popToRoute(route: any): void {
    const stack = this._stack;
    const nextIndex = stack.indexOf(route);
    invariant(
      nextIndex > -1,
      'Calling popToRoute for a route that doesn\'t exist!'
    );
    this._applyStack(stack.slice(0, nextIndex + 1));
  }

  replacePreviousAndPop(route: any): void {
    const stack = this._stack;
    const nextIndex = stack.index - 1;
    if (nextIndex < 0) {
      return;
    }
    this._applyStack(stack.replaceAtIndex(nextIndex, route).pop());
  }

  resetTo(route: any): void {
    invariant(!!route, 'Must supply route');
    this._applyStack(this._stack.slice(0).replaceAtIndex(0, route));
  }

  immediatelyResetRouteStack(routes: Array<any>): void {
    const index = routes.length - 1;
    const stack = new RouteStack(index, routes);
    // Immediately blow away all current scenes with a new key.
    this._key = guid();
    this._applyStack(stack);
  }

  getCurrentRoutes(): Array<any> {
    return this._stack.toArray();
  }

  _jumpToIndex(index: number): void {
    const stack = this._stack;
    if (index < 0 || index >= stack.size) {
      return;
    }
    this._applyStack(stack.jumpToIndex(index));
  }

  // Lyfe cycle and private methods below.

  shouldComponentUpdate(nextProps: Object, nextState: Object): boolean {
    return ReactComponentWithPureRenderMixin.shouldComponentUpdate.call(
      this,
      nextProps,
      nextState
    );
  }

  componentWillMount(): void {
    this._onNavigationBarRef = this._onNavigationBarRef.bind(this);
    this._onPositionChange = this._onPositionChange.bind(this);
    this._renderCard = this._renderCard.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }

  componentWillUnmount(): void {
    this._positionListener && this._positionListener.remove();
  }

  render(): ReactElement {
    return (
      <NavigationAnimatedView
        key={'main_' + this._key}
        navigationState={this._stack.toNavigationState()}
        renderOverlay={this._renderHeader}
        renderScene={this._renderCard}
        style={this.props.style}
      />
    );
  }

  _getInitialRouteStack(): RouteStack {
    const {initialRouteStack, initialRoute} = this.props;
    const routes = initialRouteStack || [initialRoute];
    const index = initialRoute ?
      routes.indexOf(initialRoute) :
      routes.length - 1;
    return new RouteStack(index, routes);
  }

  _renderHeader(props: NavigationSceneRendererProps): ?ReactElement {
    this._positionListener && this._positionListener.remove();
    this._positionListener = new NavigationAnimatedValueSubscription(
      props.position,
      this._onPositionChange,
    );

    const {navigationBar, navigationBarNavigator} = this.props;

    if (!navigationBar) {
      return null;
    }

    return React.cloneElement(
      navigationBar,
      {
        ref: this._onNavigationBarRef,
        navigator: navigationBarNavigator || this,
        navState: {...this.state},
      }
    );
  }

  _renderCard(props: NavigationSceneRendererProps): ReactElement {
    let direction = 'horizontal';

    const {navigationState} = props.scene;
    const {configureScene} = this.props;

    if (configureScene) {
      const route = RouteStack.getRouteByNavigationState(navigationState);
      const config = configureScene(route, this.state.routeStack);

      switch (getConfigPopDirection(config)) {
        case 'left-to-right':
          direction = 'horizontal';
          break;

        case 'top-to-bottom':
          direction = 'vertical';
          break;

        default:
          // unsupported config.
          if (__DEV__) {
            console.warn('unsupported scene configuration');
          }
      }
    }

    return (
      <NavigationCard
        {...props}
        direction={direction}
        key={'card_' + navigationState.key}
        renderScene={this._renderScene}
      />
    );
  }

  _renderScene(props: NavigationSceneRendererProps): ReactElement {
    const {navigationState} = props.scene;
    const route = RouteStack.getRouteByNavigationState(navigationState);
    return this.props.renderScene(route, this);
  }

  _applyStack(stack: NavigationLegacyNavigatorRouteStack): void {
    if (stack !== this._stack) {
      this._previousStack = this._stack;
      this._stack = stack;
      this.setState({
        presentedIndex: stack.index,
        routeStack: stack.toArray(),
      });
    }
  }

  _onNavigationBarRef(navigationBarRef: any): void {
    this._navigationBarRef = navigationBarRef;
    const {navigationBar} = this.props;
    if (navigationBar && typeof navigationBar.ref === 'function') {
      navigationBar.ref(navigationBarRef);
    }
  }

  _onPositionChange(data: {value: number}): void {
    const fromIndex = this._previousStack.index;
    const toIndex = this._stack.index;

    if (
      fromIndex !== toIndex &&
      this._navigationBarRef &&
      typeof this._navigationBarRef.updateProgress === 'function'
    ) {
      const progress = (data.value - fromIndex) / (toIndex - fromIndex);
      this._navigationBarRef.updateProgress(progress, fromIndex, toIndex);
    }
  }
}

// Legacy static members.
NavigationLegacyNavigator.BreadcrumbNavigationBar = NavigatorBreadcrumbNavigationBar;
NavigationLegacyNavigator.NavigationBar = NavigatorNavigationBar;
NavigationLegacyNavigator.SceneConfigs = NavigatorSceneConfigs;

module.exports = NavigationLegacyNavigator;
