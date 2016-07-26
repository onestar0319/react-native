/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var { View } = ReactNative;
var { TestModule } = ReactNative.NativeModules;

class PromiseTest extends React.Component {
  shouldResolve = false;
  shouldReject = false;
  shouldSucceedAsync = false;
  shouldThrowAsync = false;

  componentDidMount() {
    Promise.all([
      this.testShouldResolve(),
      this.testShouldReject(),
      this.testShouldSucceedAsync(),
      this.testShouldThrowAsync(),
    ]).then(() => TestModule.markTestPassed(
      // $FlowFixMe found when converting React.createClass to ES6
      this.shouldResolve && this.shouldReject &&
      // $FlowFixMe found when converting React.createClass to ES6
      this.shouldSucceedAsync && this.shouldThrowAsync
    ));
  }

  testShouldResolve = () => {
    return TestModule
      .shouldResolve()
      .then(() => this.shouldResolve = true)
      .catch(() => this.shouldResolve = false);
  };

  testShouldReject = () => {
    return TestModule
      .shouldReject()
      .then(() => this.shouldReject = false)
      .catch(() => this.shouldReject = true);
  };

  testShouldSucceedAsync = async (): Promise<any> => {
    try {
      await TestModule.shouldResolve();
      this.shouldSucceedAsync = true;
    } catch (e) {
      this.shouldSucceedAsync = false;
    }
  };

  testShouldThrowAsync = async (): Promise<any> => {
    try {
      await TestModule.shouldReject();
      this.shouldThrowAsync = false;
    } catch (e) {
      this.shouldThrowAsync = true;
    }
  };

  render(): ReactElement<any> {
    return <View />;
  }
}

PromiseTest.displayName = 'PromiseTest';

module.exports = PromiseTest;
