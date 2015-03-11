/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule PickerIOS
 *
 * This is a controlled component version of RKPickerIOS
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactChildren = require('ReactChildren');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var RKPickerIOSConsts = require('NativeModules').RKUIManager.RCTPicker.Constants;
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass =
  require('createReactIOSNativeComponentClass');
var merge = require('merge');

var PICKER = 'picker';

var PickerIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    onValueChange: React.PropTypes.func,
    selectedValue: React.PropTypes.any, // string or integer basically
  },

  getInitialState: function() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  },

  // Translate PickerIOS prop and children into stuff that RKPickerIOS understands.
  _stateFromProps: function(props) {
    var selectedIndex = 0;
    var items = [];
    ReactChildren.forEach(props.children, function (child, index) {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      items.push({value: child.props.value, label: child.props.label});
    });
    return {selectedIndex, items};
  },

  render: function() {
    return (
      <View style={this.props.style}>
        <RKPickerIOS
          ref={PICKER}
          style={styles.rkPickerIOS}
          items={this.state.items}
          selectedIndex={this.state.selectedIndex}
          onChange={this._onChange}
        />
      </View>
    );
  },

  _onChange: function(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
    if (this.props.onValueChange) {
      this.props.onValueChange(event.nativeEvent.newValue);
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (this.state.selectedIndex !== event.nativeEvent.newIndex) {
      this.refs[PICKER].setNativeProps({
        selectedIndex: this.state.selectedIndex
      });
    }
  },
});

PickerIOS.Item = React.createClass({
  propTypes: {
    value: React.PropTypes.any, // string or integer basically
    label: React.PropTypes.string,
  },

  render: function() {
    // These items don't get rendered directly.
    return null;
  },
});

var styles = StyleSheet.create({
  rkPickerIOS: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    height: RKPickerIOSConsts.ComponentHeight,
  },
});

var rkPickerIOSAttributes = merge(ReactIOSViewAttributes.UIView, {
  items: true,
  selectedIndex: true,
});

var RKPickerIOS = createReactIOSNativeComponentClass({
  validAttributes: rkPickerIOSAttributes,
  uiViewClassName: 'RCTPicker',
});

module.exports = PickerIOS;
