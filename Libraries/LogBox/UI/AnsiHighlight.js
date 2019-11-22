/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {ansiToJson} from 'anser';
import {Text, View} from 'react-native';
import * as React from 'react';

import type {TextStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

// Afterglow theme from https://iterm2colorschemes.com/
const COLORS = {
  'ansi-black': 'rgb(27, 27, 27)',
  'ansi-red': 'rgb(187, 86, 83)',
  'ansi-green': 'rgb(144, 157, 98)',
  'ansi-yellow': 'rgb(234, 193, 121)',
  'ansi-blue': 'rgb(125, 169, 199)',
  'ansi-magenta': 'rgb(176, 101, 151)',
  'ansi-cyan': 'rgb(140, 220, 216)',
  // Instead of white, use the default color provided to the component
  // 'ansi-white': 'rgb(216, 216, 216)',
  'ansi-bright-black': 'rgb(98, 98, 98)',
  'ansi-bright-red': 'rgb(187, 86, 83)',
  'ansi-bright-green': 'rgb(144, 157, 98)',
  'ansi-bright-yellow': 'rgb(234, 193, 121)',
  'ansi-bright-blue': 'rgb(125, 169, 199)',
  'ansi-bright-magenta': 'rgb(176, 101, 151)',
  'ansi-bright-cyan': 'rgb(140, 220, 216)',
  'ansi-bright-white': 'rgb(247, 247, 247)',
};

export default function Ansi({
  text,
  style,
}: {
  text: string,
  style: TextStyleProp,
}): React.Node {
  return (
    <View style={{flexDirection: 'column'}}>
      {text.split(/\n/).map((line, i) => (
        <View style={{flexDirection: 'row'}} key={i}>
          {ansiToJson(line, {
            json: true,
            remove_empty: true,
            use_classes: true,
          }).map((bundle, key) => {
            // Remove the vertical bar after line numbers
            const content =
              key === 1 ? bundle.content.replace(/\| $/, ' ') : bundle.content;
            const textStyle =
              bundle.fg && COLORS[bundle.fg]
                ? {
                    backgroundColor: bundle.bg && COLORS[bundle.bg],
                    color: bundle.fg && COLORS[bundle.fg],
                  }
                : {
                    backgroundColor: bundle.bg && COLORS[bundle.bg],
                  };
            return (
              <Text style={[style, textStyle]} key={key}>
                {content}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}
