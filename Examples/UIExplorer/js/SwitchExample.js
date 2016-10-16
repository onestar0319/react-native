/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Platform,
  Switch,
  Text,
  View
} = ReactNative;

class BasicSwitchExample extends React.Component {
  state = {
    trueSwitchIsOn: true,
    falseSwitchIsOn: false,
  };

  render() {
    return (
      <View>
        <Switch
          onValueChange={(value) => this.setState({falseSwitchIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.falseSwitchIsOn} />
        <Switch
          onValueChange={(value) => this.setState({trueSwitchIsOn: value})}
          value={this.state.trueSwitchIsOn} />
      </View>
    );
  }
}

class DisabledSwitchExample extends React.Component {
  render() {
    return (
      <View>
        <Switch
          disabled={true}
          style={{marginBottom: 10}}
          value={true} />
        <Switch
          disabled={true}
          value={false} />
      </View>
    );
  }
}

class ColorSwitchExample extends React.Component {
  state = {
    colorTrueSwitchIsOn: true,
    colorFalseSwitchIsOn: false,
  };

  render() {
    return (
      <View>
        <Switch
          onValueChange={(value) => this.setState({colorFalseSwitchIsOn: value})}
          onTintColor="#00ff00"
          style={{marginBottom: 10}}
          thumbTintColor="#0000ff"
          tintColor="#ff0000"
          value={this.state.colorFalseSwitchIsOn} />
        <Switch
          onValueChange={(value) => this.setState({colorTrueSwitchIsOn: value})}
          onTintColor="#00ff00"
          thumbTintColor="#0000ff"
          tintColor="#ff0000"
          value={this.state.colorTrueSwitchIsOn} />
      </View>
    );
  }
}

class EventSwitchExample extends React.Component {
  state = {
    eventSwitchIsOn: false,
    eventSwitchRegressionIsOn: true,
  };

  render() {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View>
          <Switch
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
          <Switch
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
          <Text>{this.state.eventSwitchIsOn ? 'On' : 'Off'}</Text>
        </View>
        <View>
          <Switch
            onValueChange={(value) => this.setState({eventSwitchRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn} />
          <Switch
            onValueChange={(value) => this.setState({eventSwitchRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn} />
          <Text>{this.state.eventSwitchRegressionIsOn ? 'On' : 'Off'}</Text>
        </View>
      </View>
    );
  }
}

var examples = [
  {
    title: 'Switches can be set to true or false',
    render(): React.Element<any> { return <BasicSwitchExample />; }
  },
  {
    title: 'Switches can be disabled',
    render(): React.Element<any> { return <DisabledSwitchExample />; }
  },
  {
    title: 'Change events can be detected',
    render(): React.Element<any> { return <EventSwitchExample />; }
  },
  {
    title: 'Switches are controlled components',
    render(): React.Element<any> { return <Switch />; }
  }
];

if (Platform.OS === 'ios') {
  examples.push({
    title: 'Custom colors can be provided',
    render(): React.Element<any> { return <ColorSwitchExample />; }
  });
}

exports.title = '<Switch>';
exports.displayName = 'SwitchExample';
exports.description = 'Native boolean input';
exports.examples = examples;
