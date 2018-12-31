/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  ActionSheetIOS,
  StyleSheet,
  takeSnapshot,
  Text,
  View,
  Alert,
} = ReactNative;

const BUTTONS = ['Option 0', 'Option 1', 'Option 2', 'Delete', 'Cancel'];
const DESTRUCTIVE_INDEX = 3;
const CANCEL_INDEX = 4;

type Props = $ReadOnly<{||}>;
type State = {|clicked: string|};
class ActionSheetExample extends React.Component<Props, State> {
  state = {
    clicked: 'none',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showActionSheet} style={style.button}>
          Click to show the ActionSheet
        </Text>
        <Text>Clicked button: {this.state.clicked}</Text>
      </View>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ActionSheetTintExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    clicked: 'none',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showActionSheet} style={style.button}>
          Click to show the ActionSheet
        </Text>
        <Text>Clicked button: {this.state.clicked}</Text>
      </View>
    );
  }

  showActionSheet = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        tintColor: 'green',
      },
      buttonIndex => {
        this.setState({clicked: BUTTONS[buttonIndex]});
      },
    );
  };
}

class ShareActionSheetExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  state = {
    text: '',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showShareActionSheet} style={style.button}>
          Click to show the Share ActionSheet
        </Text>
        <Text>{this.state.text}</Text>
      </View>
    );
  }

  showShareActionSheet = () => {
    ActionSheetIOS.showShareActionSheetWithOptions(
      {
        url: this.props.url,
        message: 'message to go with the shared url',
        subject: 'a subject to go in the email heading',
        excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
      },
      error => Alert.alert('Error', error),
      (completed, method) => {
        let text;
        if (completed) {
          text = `Shared via ${method}`;
        } else {
          text = "You didn't share";
        }
        this.setState({text});
      },
    );
  };
}

class ShareScreenshotExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    text: '',
  };

  render() {
    return (
      <View>
        <Text onPress={this.showShareActionSheet} style={style.button}>
          Click to show the Share ActionSheet
        </Text>
        <Text>{this.state.text}</Text>
      </View>
    );
  }

  showShareActionSheet = () => {
    // Take the snapshot (returns a temp file uri)
    takeSnapshot('window')
      .then(uri => {
        // Share image data
        ActionSheetIOS.showShareActionSheetWithOptions(
          {
            url: uri,
            excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
          },
          error => Alert.alert('Error', error),
          (completed, method) => {
            let text;
            if (completed) {
              text = `Shared via ${method}`;
            } else {
              text = "You didn't share";
            }
            this.setState({text});
          },
        );
      })
      .catch(error => Alert.alert('Error', error));
  };
}

const style = StyleSheet.create({
  button: {
    marginBottom: 10,
    fontWeight: '500',
  },
});

exports.title = 'ActionSheetIOS';
exports.description = "Interface to show iOS' action sheets";
exports.examples = [
  {
    title: 'Show Action Sheet',
    render(): React.Element<any> {
      return <ActionSheetExample />;
    },
  },
  {
    title: 'Show Action Sheet with tinted buttons',
    render(): React.Element<any> {
      return <ActionSheetTintExample />;
    },
  },
  {
    title: 'Show Share Action Sheet',
    render(): React.Element<any> {
      return <ShareActionSheetExample url="https://code.facebook.com" />;
    },
  },
  {
    title: 'Share Local Image',
    render(): React.Element<any> {
      return <ShareActionSheetExample url="bunny.png" />;
    },
  },
  {
    title: 'Share Screenshot',
    render(): React.Element<any> {
      return <ShareScreenshotExample />;
    },
  },
];
