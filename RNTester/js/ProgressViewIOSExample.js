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
const {ProgressViewIOS, StyleSheet, View} = ReactNative;

type Props = {||};
type State = {|
  progress: number,
|};

class ProgressViewExample extends React.Component<Props, State> {
  _rafId: ?AnimationFrameID = null;

  state = {
    progress: 0,
  };

  componentDidMount() {
    this.updateProgress();
  }

  componentWillUnmount() {
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
    }
  }

  updateProgress = () => {
    var progress = this.state.progress + 0.01;
    this.setState({progress});
    this._rafId = requestAnimationFrame(() => this.updateProgress());
  };

  getProgress = offset => {
    var progress = this.state.progress + offset;
    return Math.sin(progress % Math.PI) % 1;
  };

  render() {
    return (
      <View style={styles.container}>
        <ProgressViewIOS
          style={styles.progressView}
          progress={this.getProgress(0)}
        />
        <ProgressViewIOS
          style={styles.progressView}
          progressTintColor="purple"
          progress={this.getProgress(0.2)}
        />
        <ProgressViewIOS
          style={styles.progressView}
          progressTintColor="red"
          progress={this.getProgress(0.4)}
        />
        <ProgressViewIOS
          style={styles.progressView}
          progressTintColor="orange"
          progress={this.getProgress(0.6)}
        />
        <ProgressViewIOS
          style={styles.progressView}
          progressTintColor="yellow"
          progress={this.getProgress(0.8)}
        />
      </View>
    );
  }
}

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = 'ProgressViewIOS';
exports.description = 'ProgressViewIOS';
exports.examples = [
  {
    title: 'ProgressViewIOS',
    render() {
      return <ProgressViewExample />;
    },
  },
];

var styles = StyleSheet.create({
  container: {
    marginTop: -20,
    backgroundColor: 'transparent',
  },
  progressView: {
    marginTop: 20,
  },
});
