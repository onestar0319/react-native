/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow strict-local
 */

'use strict';

const React = require('react');
const LogBoxInspectorMessageHeader = require('../LogBoxInspectorMessageHeader')
  .default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorMessageHeader', () => {
  it('should render error', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Error"
        level="error"
        collapsed={false}
        message={{
          content: 'Some error message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render fatal', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Fatal Error"
        level="fatal"
        collapsed={false}
        message={{
          content: 'Some fatal message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render syntax error', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Syntax Error"
        level="syntax"
        collapsed={false}
        message={{
          content: 'Some syntax error message',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should not render See More button for short content', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={false}
        message={{
          content: 'Short',
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should not render "See More" if expanded', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={false}
        message={{content: '#'.repeat(301), substitutions: []}}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render "See More" if collapsed', () => {
    const output = render.shallowRender(
      <LogBoxInspectorMessageHeader
        title="Warning"
        level="warn"
        collapsed={true}
        message={{
          content: '#'.repeat(301),
          substitutions: [],
        }}
        onPress={() => {}}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
