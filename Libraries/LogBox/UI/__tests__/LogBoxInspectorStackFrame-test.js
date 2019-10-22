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
const LogBoxInspectorStackFrame = require('../LogBoxInspectorStackFrame')
  .default;
const render = require('../../../../jest/renderer');

describe('LogBoxInspectorStackFrame', () => {
  it('should render stack frame', () => {
    const output = render.shallowRender(
      <LogBoxInspectorStackFrame
        onPress={() => {}}
        frame={{
          column: 1,
          file: 'app.js',
          lineNumber: 1,
          methodName: 'foo',
          collapse: false,
        }}
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
