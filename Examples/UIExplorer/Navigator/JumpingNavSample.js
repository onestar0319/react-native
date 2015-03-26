/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var React = require('react-native');
var {
  Navigator,
  PixelRatio,
  StyleSheet,
  ScrollView,
  TabBarIOS,
  Text,
  TouchableHighlight,
  View,
} = React;

var _getRandomRoute = function() {
  return {
    randNumber: Math.ceil(Math.random() * 1000),
  };
};

class NavButton extends React.Component {
  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        underlayColor="#B5B5B5"
        onPress={this.props.onPress}>
        <Text style={styles.buttonText}>{this.props.text}</Text>
      </TouchableHighlight>
    );
  }
}

var ROUTE_STACK = [
  _getRandomRoute(),
  _getRandomRoute(),
  _getRandomRoute(),
];
var INIT_ROUTE_INDEX = 1;

class JumpingNavBar extends React.Component {
  render() {
    return (
      <View style={styles.tabs}>
        <TabBarIOS
          selectedTab={'tab_' + this.props.tabIndex}>
          <TabBarIOS.Item
            name="tab_0"
            icon={require('image!tabnav_notification')}
            selected={this.props.tabIndex === 0}
            onPress={() => { this.props.onTabIndex(0); }}
            children={<View />}
          />
          <TabBarIOS.Item
            name="tab_1"
            icon={require('image!tabnav_list')}
            selected={this.props.tabIndex === 1}
            onPress={() => { this.props.onTabIndex(1); }}
            children={<View />}
          />
          <TabBarIOS.Item
            name="tab_2"
            icon={require('image!tabnav_settings')}
            selected={this.props.tabIndex === 2}
            onPress={() => { this.props.onTabIndex(2); }}
            children={<View />}
          />
        </TabBarIOS>
      </View>
    );
  }
}

var JumpingNavSample = React.createClass({
  getInitialState: function() {
    return {
      tabIndex: INIT_ROUTE_INDEX,
    };
  },

  render: function() {
    return (
      <Navigator
        debugOverlay={false}
        style={styles.appContainer}
        ref={(navigator) => {
          this._navigator = navigator;
        }}
        initialRoute={ROUTE_STACK[INIT_ROUTE_INDEX]}
        initialRouteStack={ROUTE_STACK}
        renderScene={this.renderScene}
        navigationBar={
          <JumpingNavBar
            routeStack={ROUTE_STACK}
            tabIndex={this.state.tabIndex}
            onTabIndex={(index) => {
              this.setState({ tabIndex: index }, () => {
                this._navigator.jumpTo(ROUTE_STACK[index]);
              });
            }}
          />
        }
        onWillFocus={(route) => {
          this.setState({
            tabIndex: ROUTE_STACK.indexOf(route),
          });
        }}
        shouldJumpOnBackstackPop={true}
      />
    );
  },

  renderScene: function(route, navigator) {
    var backBtn;
    var forwardBtn;
    if (ROUTE_STACK.indexOf(route) !== 0) {
      backBtn = (
        <NavButton
          onPress={() => {
            navigator.jumpBack();
          }}
          text="jumpBack"
        />
      );
    }
    if (ROUTE_STACK.indexOf(route) !== ROUTE_STACK.length - 1) {
      forwardBtn = (
        <NavButton
          onPress={() => {
            navigator.jumpForward();
          }}
          text="jumpForward"
        />
      );
    }
    return (
      <ScrollView style={styles.scene}>
        <Text style={styles.messageText}>#{route.randNumber}</Text>
        {backBtn}
        {forwardBtn}
        <NavButton
          onPress={() => {
            navigator.jumpTo(ROUTE_STACK[1]);
          }}
          text="jumpTo middle route"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.pop();
          }}
          text="Exit Navigation Example"
        />
        <NavButton
          onPress={() => {
            this.props.navigator.push({
              message: 'Came from jumping example',
            });
          }}
          text="Nav Menu"
        />
      </ScrollView>
    );
  },
});

var styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: '#CDCDCD',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#dddddd',
    flex: 1,
  },
  messageText: {
    fontSize: 17,
    fontWeight: '500',
    padding: 15,
    marginTop: 50,
    marginLeft: 15,
  },
  scene: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#EAEAEA',
  },
  tabs: {
    height: 50,
  }
});

module.exports = JumpingNavSample;
