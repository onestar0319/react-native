/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AppEventsTest
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  NativeAppEventEmitter,
  StyleSheet,
  Text,
  View,
} = ReactNative;
var { TestModule } = ReactNative.NativeModules;

var deepDiffer = require('deepDiffer');

var TEST_PAYLOAD = {foo: 'bar'};

type AppEvent = { data: Object, ts: number, };
type State = {
  sent: 'none' | AppEvent,
  received: 'none' | AppEvent,
  elapsed?: string,
};

var AppEventsTest = React.createClass({
  getInitialState(): State {
    return {sent: 'none', received: 'none'};
  },
  componentDidMount: function() {
    NativeAppEventEmitter.addListener('testEvent', this.receiveEvent);
    var event = {data: TEST_PAYLOAD, ts: Date.now()};
    TestModule.sendAppEvent('testEvent', event);
    this.setState({sent: event});
  },
  receiveEvent: function(event: any) {
    if (deepDiffer(event.data, TEST_PAYLOAD)) {
      throw new Error('Received wrong event: ' + JSON.stringify(event));
    }
    var elapsed = (Date.now() - event.ts) + 'ms';
    this.setState({received: event, elapsed}, TestModule.markTestCompleted);
  },
  render: function() {
    return (
      <View style={styles.container}>
        <Text>
          {JSON.stringify(this.state, null, '  ')}
        </Text>
      </View>
    );
  }
});

AppEventsTest.displayName = 'AppEventsTest';

var styles = StyleSheet.create({
  container: {
    margin: 40,
  },
});

module.exports = AppEventsTest;
