/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule KeyboardAvoidingViewExample
 */
'use strict';

const React = require('React');
const ReactNative = require('react-native');
const {
  KeyboardAvoidingView,
  Modal,
  SegmentedControlIOS,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = ReactNative;

const UIExplorerBlock = require('./UIExplorerBlock');
const UIExplorerPage = require('./UIExplorerPage');

class KeyboardAvoidingViewExample extends React.Component {
  static title = '<KeyboardAvoidingView>';
  static description = 'Base component for views that automatically adjust their height or position to move out of the way of the keyboard.';

  state = {
    behavior: 'padding',
    modalOpen: false,
  };

  onSegmentChange = (segment: String) => {
    this.setState({behavior: segment.toLowerCase()});
  };

  renderExample = () => {
    return (
      <View style={styles.outerContainer}>
        <Modal animationType="fade" visible={this.state.modalOpen}>
          <KeyboardAvoidingView behavior={this.state.behavior} style={styles.container}>
            <SegmentedControlIOS
              onValueChange={this.onSegmentChange}
              selectedIndex={this.state.behavior === 'padding' ? 0 : 1}
              style={styles.segment}
              values={['Padding', 'Position']} />
            <TextInput
              placeholder="<TextInput />"
              style={styles.textInput} />
          </KeyboardAvoidingView>
          <TouchableHighlight
            onPress={() => this.setState({modalOpen: false})}
            style={styles.closeButton}>
            <Text>Close</Text>
          </TouchableHighlight>
        </Modal>

        <TouchableHighlight onPress={() => this.setState({modalOpen: true})}>
          <Text>Open Example</Text>
        </TouchableHighlight>
      </View>
    );
  };

  render() {
    return (
      <UIExplorerPage title="Keyboard Avoiding View">
        <UIExplorerBlock title="Keyboard-avoiding views move out of the way of the keyboard.">
          {this.renderExample()}
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  }
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textInput: {
    borderRadius: 5,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 10,
  },
  segment: {
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    left: 10,
  }
});

module.exports = KeyboardAvoidingViewExample;
