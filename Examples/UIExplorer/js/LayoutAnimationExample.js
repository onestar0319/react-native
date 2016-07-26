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

const React = require('react');
const ReactNative = require('react-native');
const {
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} = ReactNative;

class AddRemoveExample extends React.Component {
  state = {
    views: [],
  };

  componentWillUpdate() {
    LayoutAnimation.easeInEaseOut();
  }

  _onPressAddView = () => {
    this.setState((state) => ({views: [...state.views, {}]}));
  };

  _onPressRemoveView = () => {
    this.setState((state) => ({views: state.views.slice(0, -1)}));
  };

  render() {
    const views = this.state.views.map((view, i) =>
      <View key={i} style={styles.view}>
        <Text>{i}</Text>
      </View>
    );
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressAddView}>
          <View style={styles.button}>
            <Text>Add view</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={this._onPressRemoveView}>
          <View style={styles.button}>
            <Text>Remove view</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>
          {views}
        </View>
      </View>
    );
  }
}

const GreenSquare = () =>
  <View style={styles.greenSquare}>
    <Text>Green square</Text>
  </View>;

const BlueSquare = () =>
  <View style={styles.blueSquare}>
    <Text>Blue square</Text>
  </View>;

class CrossFadeExample extends React.Component {
  state = {
    toggled: false,
  };

  _onPressToggle = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState((state) => ({toggled: !state.toggled}));
  };

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._onPressToggle}>
          <View style={styles.button}>
            <Text>Toggle</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.viewContainer}>
          {
            this.state.toggled ?
            <GreenSquare /> :
            <BlueSquare />
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    padding: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
  },
  viewContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  view: {
    height: 54,
    width: 54,
    backgroundColor: 'red',
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueSquare: {
    width: 150,
    height: 150,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

exports.title = 'Layout Animation';
exports.description = 'Layout animation';
exports.examples = [{
  title: 'Add and remove views',
  render(): ReactElement<any> {
    return <AddRemoveExample />;
  },
}, {
  title: 'Cross fade views',
  render(): ReactElement<any> {
    return <CrossFadeExample />;
  },
}];
