/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

var React = require('react-native');
var {
  SwitchIOS,
  Text,
  View
} = React;

var BasicSwitchExample = React.createClass({
  getInitialState() {
    return {
      trueSwitchIsOn: true,
      falseSwitchIsOn: false,
    };
  },
  render() {
    return (
      <View>
        <SwitchIOS
          onValueChange={(value) => this.setState({falseSwitchIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.falseSwitchIsOn} />
        <SwitchIOS
          onValueChange={(value) => this.setState({trueSwitchIsOn: value})}
          value={this.state.trueSwitchIsOn} />
      </View>
    );
  }
});

var DisabledSwitchExample = React.createClass({
  render() {
    return (
      <View>
        <SwitchIOS
          disabled={true}
          style={{marginBottom: 10}}
          value={true} />
        <SwitchIOS
          disabled={true}
          value={false} />
      </View>
    );
  },
});

var ColorSwitchExample = React.createClass({
  getInitialState() {
    return {
      colorTrueSwitchIsOn: true,
      colorFalseSwitchIsOn: false,
    };
  },
  render() {
    return (
      <View>
        <SwitchIOS
          onValueChange={(value) => this.setState({colorFalseSwitchIsOn: value})}
          onTintColor="#00ff00"
          style={{marginBottom: 10}}
          thumbTintColor="#0000ff"
          tintColor="#ff0000"
          value={this.state.colorFalseSwitchIsOn} />
        <SwitchIOS
          onValueChange={(value) => this.setState({colorTrueSwitchIsOn: value})}
          onTintColor="#00ff00"
          thumbTintColor="#0000ff"
          tintColor="#ff0000"
          value={this.state.colorTrueSwitchIsOn} />
      </View>
    );
  },
});

var EventSwitchExample = React.createClass({
  getInitialState() {
    return {
      eventSwitchIsOn: false,
      eventSwitchRegressionIsOn: true,
    };
  },
  render() {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View>
          <SwitchIOS
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
          <SwitchIOS
            onValueChange={(value) => this.setState({eventSwitchIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchIsOn} />
            <Text>{this.state.eventSwitchIsOn ? "On" : "Off"}</Text>
        </View>
        <View>
          <SwitchIOS
            onValueChange={(value) => this.setState({eventSwitchRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn} />
          <SwitchIOS
            onValueChange={(value) => this.setState({eventSwitchRegressionIsOn: value})}
            style={{marginBottom: 10}}
            value={this.state.eventSwitchRegressionIsOn} />
          <Text>{this.state.eventSwitchRegressionIsOn ? "On" : "Off"}</Text>
        </View>
      </View>
    );
  }
});

exports.title = '<SwitchIOS>';
exports.description = 'Native boolean input';
exports.examples = [
  {
    title: 'Switches can be set to true or false',
    render() { return <BasicSwitchExample />; }
  },
  {
    title: 'Switches can be disabled',
    render() { return <DisabledSwitchExample />; }
  },
  {
    title: 'Custom colors can be provided',
    render() { return <ColorSwitchExample />; }
  },
  {
    title: 'Change events can be detected',
    render() { return <EventSwitchExample />; }
  },
  {
    title: 'Switches are controlled components',
    render() { return <SwitchIOS />; }
  }
];
