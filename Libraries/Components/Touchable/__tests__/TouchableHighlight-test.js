/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

jest.disableAutomock();

jest.mock('NativeModules')
  .mock('Text')
  .mock('ensureComponentIsNative')
  .mock('View');

const React = require('React');
const ReactTestRenderer = require('react/lib/ReactTestRenderer');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');

describe('TouchableHighlight', () => {
  it('renders correctly', () => {
    const instance = ReactTestRenderer.create(
      <TouchableHighlight style={{}}>
        <Text>Touchable</Text>
      </TouchableHighlight>
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
});
