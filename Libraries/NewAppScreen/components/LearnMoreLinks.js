/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import Colors from './Colors';

const links = [
  {
    title: 'The Basics',
    link: 'https://facebook.github.io/react-native/docs/tutorial',
    description:
      'Read the docs on what to do once seen how to work in React Native.',
  },
  {
    title: 'Style',
    link: 'https://facebook.github.io/react-native/docs/style',
    description: 'All of the core components accept a prop named style.',
  },
  {
    title: 'Layout',
    link: 'https://facebook.github.io/react-native/docs/flexbox',
    description:
      'A component can specify the layout of its children using the flexbox specification.',
  },
  {
    title: 'Components',
    link: 'https://facebook.github.io/react-native/docs/components-and-apis',
    description: 'The full list of components and APIs inside React Native.',
  },
  {
    title: 'Navigation',
    link: 'https://facebook.github.io/react-native/docs/navigation',
    description:
      'How to handle moving between screens inside your application.',
  },
  {
    title: 'Networking',
    link: 'https://facebook.github.io/react-native/docs/network',
    description: 'How to use the Fetch API in React Native.',
  },
  {
    title: 'Help',
    link: 'https://facebook.github.io/react-native/help',
    description:
      'Need more help? There are many other React Native developers who may have the answer.',
  },
];

const LinkList = () => (
  <View style={styles.container}>
    {links.map((item, index) => {
      return (
        <React.Fragment key={index}>
          <View style={styles.separator} />
          <TouchableOpacity
            accessibilityRole={'button'}
            onPress={() => Linking.openURL(item.link)}
            style={styles.linkContainer}>
            <Text style={styles.link}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        </React.Fragment>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  linkContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    flex: 2,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.primary,
  },
  description: {
    flex: 3,
    paddingVertical: 16,
    fontWeight: '400',
    fontSize: 18,
    color: Colors.dark,
  },
  separator: {
    backgroundColor: Colors.light,
    height: 1,
  },
});

export default LinkList;
