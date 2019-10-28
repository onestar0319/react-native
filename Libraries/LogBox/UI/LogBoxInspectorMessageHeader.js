/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import View from '../../Components/View/View';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import LogBoxMessage from './LogBoxMessage';
import type {LogLevel} from '../Data/LogBoxLog';
import type {Message} from '../Data/parseLogBoxLog';

type Props = $ReadOnly<{|
  collapsed: boolean,
  message: Message,
  level: LogLevel,
  onPress: () => void,
|}>;

function LogBoxInspectorMessageHeader(props: Props): React.Node {
  function renderShowMore() {
    if (props.message.content.length < 140) {
      return null;
    }
    return (
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundLightColor(1),
        }}
        style={messageStyles.button}
        onPress={() => props.onPress()}>
        <Text style={messageStyles.collapse}>
          {props.collapsed ? 'see more' : 'collapse'}
        </Text>
      </LogBoxButton>
    );
  }

  return (
    <View style={messageStyles.body}>
      <View style={messageStyles.heading}>
        <Text style={[messageStyles.headingText, messageStyles[props.level]]}>
          {props.level === 'warn' ? 'Warning' : 'Error'}
        </Text>
        {renderShowMore()}
      </View>
      <Text
        numberOfLines={props.collapsed ? 5 : null}
        style={messageStyles.bodyText}>
        <LogBoxMessage
          message={props.message}
          style={messageStyles.messageText}
        />
      </Text>
    </View>
  );
}

const messageStyles = StyleSheet.create({
  body: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
    shadowOpacity: 0.5,
    elevation: 2,
    flex: 0,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  headingText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 28,
  },
  warn: {
    color: LogBoxStyle.getWarningColor(1),
  },
  error: {
    color: LogBoxStyle.getErrorColor(1),
  },
  messageText: {
    color: LogBoxStyle.getTextColor(0.6),
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 12,
    fontWeight: '300',
    lineHeight: 12,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
});

export default LogBoxInspectorMessageHeader;
