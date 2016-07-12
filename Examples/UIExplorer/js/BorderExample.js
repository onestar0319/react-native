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
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  View
} = ReactNative;

var styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
  },
  border1: {
    borderWidth: 10,
    borderColor: 'brown',
  },
  borderRadius: {
    borderWidth: 10,
    borderRadius: 10,
    borderColor: 'cyan',
  },
  border2: {
    borderWidth: 10,
    borderTopColor: 'red',
    borderRightColor: 'yellow',
    borderBottomColor: 'green',
    borderLeftColor: 'blue',
  },
  border3: {
    borderColor: 'purple',
    borderTopWidth: 10,
    borderRightWidth: 20,
    borderBottomWidth: 30,
    borderLeftWidth: 40,
  },
  border4: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border5: {
    borderRadius: 50,
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',
  },
  border6: {
    borderTopWidth: 10,
    borderTopColor: 'red',
    borderRightWidth: 20,
    borderRightColor: 'yellow',
    borderBottomWidth: 30,
    borderBottomColor: 'green',
    borderLeftWidth: 40,
    borderLeftColor: 'blue',

    borderTopLeftRadius: 100,
  },
  border7: {
    borderWidth: 10,
    borderColor: '#f007',
    borderRadius: 30,
    overflow: 'hidden',
  },
  border7_inner: {
    backgroundColor: 'blue',
    width: 100,
    height: 100
  },
  border8: {
    width: 60,
    height: 60,
    borderColor: 'black',
    marginRight: 10,
    backgroundColor: 'lightgrey',
  },
  border9: {
    borderWidth: 10,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
  },
  border10: {
    borderWidth: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'black',
    elevation: 10,
  },
  border11: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    overflow: 'hidden',
    borderTopWidth: 50,
    borderRightWidth: 0,
    borderBottomWidth: 50,
    borderLeftWidth: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'red',
  },
});

exports.title = 'Border';
exports.description = 'Demonstrates some of the border styles available to Views.';
exports.examples = [
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor',
    render() {
      return <View style={[styles.box, styles.border1]} />;
    }
  },
  {
    title: 'Equal-Width / Same-Color',
    description: 'borderWidth & borderColor & borderRadius',
    render() {
      return <View style={[styles.box, styles.borderRadius]} />;
    }
  },
  {
    title: 'Equal-Width Borders',
    description: 'borderWidth & border*Color',
    render() {
      return <View style={[styles.box, styles.border2]} />;
    }
  },
  {
    title: 'Same-Color Borders',
    description: 'border*Width & borderColor',
    render() {
      return <View style={[styles.box, styles.border3]} />;
    }
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    render() {
      return <View style={[styles.box, styles.border4]} />;
    }
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    platform: 'ios',
    render() {
      return <View style={[styles.box, styles.border5]} />;
    }
  },
  {
    title: 'Custom Borders',
    description: 'border*Width & border*Color',
    platform: 'ios',
    render() {
      return <View style={[styles.box, styles.border6]} />;
    }
  },
  {
    title: 'Custom Borders',
    description: 'borderRadius & clipping',
    platform: 'ios',
    render() {
      return (
        <View style={[styles.box, styles.border7]}>
          <View style={styles.border7_inner} />
        </View>
      );
    }
  },
  {
    title: 'Single Borders',
    description: 'top, left, bottom right',
    render() {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={[styles.box, styles.border8, {borderTopWidth: 5}]} />
          <View style={[styles.box, styles.border8, {borderLeftWidth: 5}]} />
          <View style={[styles.box, styles.border8, {borderBottomWidth: 5}]} />
          <View style={[styles.box, styles.border8, {borderRightWidth: 5}]} />
        </View>
      );
    }
  },
  {
    title: 'Corner Radii',
    description: 'borderTopLeftRadius & borderBottomRightRadius',
    render() {
      return <View style={[styles.box, styles.border9]} />;
    }
  },
  {
    title: 'Corner Radii / Elevation',
    description: 'borderTopLeftRadius & borderBottomRightRadius & elevation',
    platform: 'android',
    render() {
      return <View style={[styles.box, styles.border10]} />;
    }
  },
  {
    title: 'CSS Trick - Triangle',
    description: 'create a triangle by manipulating border colors and widths',
    render() {
      return <View style={[styles.border11]} />;
    }
  },
];
