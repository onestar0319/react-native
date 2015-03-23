/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIExplorerBlock
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

var UIExplorerBlock = React.createClass({
  propTypes: {
    title: React.PropTypes.string,
    description: React.PropTypes.string,
  },

  getInitialState: function() {
    return {description: (null: ?string)};
  },

  render: function() {
    var description;
    if (this.props.description) {
      description =
        <Text style={styles.descriptionText}>
          {this.props.description}
        </Text>;
    }

    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            {this.props.title}
          </Text>
          {description}
        </View>
        <View style={styles.children}>
          {this.props.children}
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    backgroundColor: '#ffffff',
    margin: 10,
    marginVertical: 5,
    overflow: 'hidden',
  },
  titleContainer: {
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    backgroundColor: '#f6f7f8',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
  },
  disclosure: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
  },
  disclosureIcon: {
    width: 12,
    height: 8,
  },
  children: {
    padding: 10,
  }
});

module.exports = UIExplorerBlock;
