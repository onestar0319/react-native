/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var RCTTestModule = require('NativeModules').TestModule;
var React = require('react-native');
var {
  StyleSheet,
  Text,
  TimerMixin,
  View,
} = React;

var TimersTest = React.createClass({
  mixins: [TimerMixin],

  getInitialState() {
    return {
      count: 0,
      done: false,
    };
  },

  componentDidMount() {
    this.testSetTimeout0();
  },

  testSetTimeout0() {
    this.setTimeout(this.testSetTimeout1, 0);
  },

  testSetTimeout1() {
    this.setTimeout(this.testSetTimeout50, 1);
  },

  testSetTimeout50() {
    this.setTimeout(this.testRequestAnimationFrame, 50);
  },

  testRequestAnimationFrame() {
    this.requestAnimationFrame(this.testSetInterval0);
  },

  testSetInterval0() {
    this._nextTest = this.testSetInterval20;
    this._interval = this.setInterval(this._incrementInterval, 0);
  },

  testSetInterval20() {
    this._nextTest = this.testSetImmediate;
    this._interval = this.setInterval(this._incrementInterval, 20);
  },

  testSetImmediate() {
    this.setImmediate(this.testClearTimeout0);
  },

  testClearTimeout0() {
    var timeout = this.setTimeout(() => this._fail('testClearTimeout0'), 0);
    this.clearTimeout(timeout);
    this.testClearTimeout30();
  },

  testClearTimeout30() {
    var timeout = this.setTimeout(() => this._fail('testClearTimeout30'), 30);
    this.clearTimeout(timeout);
    this.setTimeout(this.testClearMulti, 50);
  },

  testClearMulti() {
    var fails = [this.setTimeout(() => this._fail('testClearMulti-1'), 20)];
    fails.push(this.setTimeout(() => this._fail('testClearMulti-2'), 50));
    var delayClear = this.setTimeout(() => this._fail('testClearMulti-3'), 50);
    fails.push(this.setTimeout(() => this._fail('testClearMulti-4'), 0));

    this.setTimeout(this.testOrdering, 100); // Next test interleaved

    fails.push(this.setTimeout(() => this._fail('testClearMulti-5'), 10));

    fails.forEach((timeout) => this.clearTimeout(timeout));
    this.setTimeout(() => this.clearTimeout(delayClear), 20);
  },

  testOrdering() {
    // Clear timers are set first because it's more likely to uncover bugs.
    var fail0;
    this.setImmediate(() => this.clearTimeout(fail0));
    fail0 = this.setTimeout(
      () => this._fail('testOrdering-t0, setImmediate should happen before ' +
        'setTimeout 0'),
      0
    );
    var failAnim; // This should fail without the t=0 fastpath feature.
    this.setTimeout(() => this.cancelAnimationFrame(failAnim), 0);
    failAnim = this.requestAnimationFrame(
      () => this._fail('testOrdering-Anim, setTimeout 0 should happen before ' +
        'requestAnimationFrame')
    );
    var fail50;
    this.setTimeout(() => this.clearTimeout(fail50), 20);
    fail50 = this.setTimeout(
      () => this._fail('testOrdering-t50, setTimeout 20 should happen before ' +
        'setTimeout 50'),
      50
    );
    this.setTimeout(this.done, 75);
  },

  done() {
    this.setState({done: true}, RCTTestModule.markTestCompleted);
  },

  render() {
    return (
      <View style={styles.container}>
        <Text>
          {this.constructor.displayName + ': \n'}
          Intervals: {this.state.count + '\n'}
          {this.state.done ? 'Done' : 'Testing...'}
        </Text>
      </View>
    );
  },

  _incrementInterval() {
    if (this.state.count > 3) {
      throw new Error('interval incremented past end.');
    }
    if (this.state.count === 3) {
      this.clearInterval(this._interval);
      this.setState({count: 0}, this._nextTest);
      return;
    }
    this.setState({count: this.state.count + 1});
  },

  _fail(caller) {
    throw new Error('_fail called by ' + caller);
  },
});

var styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

module.exports = TimersTest;
