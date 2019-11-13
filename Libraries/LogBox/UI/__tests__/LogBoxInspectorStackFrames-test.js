/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const LogBoxInspectorStackFrames = require('../LogBoxInspectorStackFrames')
  .default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

const log = new LogBoxLog({
  level: 'warn',
  isComponentError: false,
  message: {
    content: 'Some kind of message (latest)',
    substitutions: [],
  },
  stack: [
    {
      column: 1,
      file: 'dependency.js',
      lineNumber: 1,
      methodName: 'dep',
      collapse: true,
    },
    {
      column: 1,
      file: 'app.js',
      lineNumber: 1,
      methodName: 'foo',
      collapse: false,
    },
  ],
  category: 'Some kind of message (latest)',
  componentStack: [],
});

const logNoStackFrames = new LogBoxLog({
  level: 'warn',
  isComponentError: false,
  message: {
    content: 'Some kind of message (latest)',
    substitutions: [],
  },
  stack: [],
  category: 'Some kind of message (latest)',
  componentStack: [],
});

describe('LogBoxInspectorStackFrame', () => {
  it('should render stack frames with 1 frame collapsed', () => {
    const output = render.shallowRender(
      <LogBoxInspectorStackFrames onRetry={() => {}} log={log} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null for empty stack frames', () => {
    const output = render.shallowRender(
      <LogBoxInspectorStackFrames onRetry={() => {}} log={logNoStackFrames} />,
    );

    expect(output).toMatchSnapshot();
  });
});
