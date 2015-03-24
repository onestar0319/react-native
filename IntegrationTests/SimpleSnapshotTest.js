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
  StyleSheet,
  View,
} = React;

var { TestModule } = React.addons;

var SimpleSnapshotTest = React.createClass({
  componentDidMount() {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
    requestAnimationFrame(() => TestModule.verifySnapshot(this.done));
  },

  done() {
    TestModule.markTestCompleted();
  },

  render() {
    return (
      <View style={{backgroundColor: 'white', padding: 100}}>
        <View style={styles.box1} />
        <View style={styles.box2} />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  box1: {
    width: 80,
    height: 50,
    backgroundColor: 'red',
  },
  box2: {
    top: -10,
    left: 20,
    width: 70,
    height: 90,
    backgroundColor: 'blue',
  },
});

module.exports = SimpleSnapshotTest;
