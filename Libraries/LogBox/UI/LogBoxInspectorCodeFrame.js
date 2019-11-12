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

import * as React from 'react';
import {Platform, ScrollView} from 'react-native';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import * as LogBoxStyle from './LogBoxStyle';
import type {CodeFrame} from '../Data/parseLogBoxLog';
import LogBoxButton from './LogBoxButton';
import openFileInEditor from '../../Core/Devtools/openFileInEditor';
import stripAnsi from 'strip-ansi';
import LogBoxInspectorSection from './LogBoxInspectorSection';
type Props = $ReadOnly<{|
  codeFrame: ?CodeFrame,
|}>;

function LogBoxInspectorCodeFrame(props: Props): React.Node {
  const codeFrame = props.codeFrame;
  if (codeFrame == null) {
    return null;
  }

  function getFileName() {
    const matches = /[^/]*$/.exec(codeFrame.fileName);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    return codeFrame.fileName;
  }

  return (
    <LogBoxInspectorSection heading="Source">
      <View style={styles.box}>
        <View style={styles.frame}>
          <ScrollView horizontal>
            <Text style={styles.content}>{stripAnsi(codeFrame.content)}</Text>
          </ScrollView>
        </View>
        <LogBoxButton
          backgroundColor={{
            default: 'transparent',
            pressed: LogBoxStyle.getBackgroundDarkColor(1),
          }}
          style={styles.button}
          onPress={() => {
            openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
          }}>
          <Text style={styles.fileText}>
            {getFileName()} ({codeFrame.location.row}:
            {codeFrame.location.column +
              1 /* Code frame columns are zero indexed */}
            )
          </Text>
        </LogBoxButton>
      </View>
    </LogBoxInspectorSection>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    borderRadius: 3,
  },
  frame: {
    padding: 10,
    borderBottomColor: LogBoxStyle.getTextColor(0.1),
    borderBottomWidth: 1,
  },
  button: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  content: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
  fileText: {
    color: LogBoxStyle.getTextColor(0.5),
    textAlign: 'center',
    flex: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
});

export default LogBoxInspectorCodeFrame;
