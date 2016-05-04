/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTRootViewIntegrationTestsApp
 */
'use strict';

require('regenerator-runtime/runtime');

var React = require('react');
var ReactNative = require('react-native');

var {
  AppRegistry,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

/* Keep this list in sync with RCTRootViewIntegrationTests.m */
var TESTS = [
  require('./PropertiesUpdateTest'),
  require('./ReactContentSizeUpdateTest'),
  require('./SizeFlexibilityUpdateTest'),
];

TESTS.forEach(
  (test) => AppRegistry.registerComponent(test.displayName, () => test)
);

var RCTRootViewIntegrationTestsApp = React.createClass({
  getInitialState: function() {
    return {
      test: null,
    };
  },
  render: function() {
    if (this.state.test) {
      return (
        <ScrollView>
          <this.state.test />
        </ScrollView>
      );
    }
    return (
      <View style={styles.container}>
        <Text style={styles.row}>
          Click on a test to run it in this shell for easier debugging and
          development.  Run all tests in the testing environment with cmd+U in
          Xcode.
        </Text>
        <View style={styles.separator} />
        <ScrollView>
          {TESTS.map((test) => [
            <TouchableOpacity
              onPress={() => this.setState({test})}
              style={styles.row}>
              <Text style={styles.testName}>
                {test.displayName}
              </Text>
            </TouchableOpacity>,
            <View style={styles.separator} />
          ])}
        </ScrollView>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginTop: 40,
    margin: 15,
  },
  row: {
    padding: 10,
  },
  testName: {
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#bbbbbb',
  },
});

AppRegistry.registerComponent('RCTRootViewIntegrationTestsApp', () => RCTRootViewIntegrationTestsApp);
