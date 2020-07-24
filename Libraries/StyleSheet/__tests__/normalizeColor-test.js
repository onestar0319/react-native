/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const {OS} = require('../../Utilities/Platform');
const normalizeColor = require('../normalizeColor');

it('forwards calls to @react-native/normalize-color/base', () => {
  jest
    .resetModules()
    .mock('@react-native/normalize-color/base', () => jest.fn());

  expect(require('../normalizeColor')('#abc')).not.toBe(null);
  expect(require('@react-native/normalize-color/base')).toBeCalled();
});

describe('iOS', () => {
  if (OS === 'ios') {
    const PlatformColor = require('../PlatformColorValueTypes.ios')
      .PlatformColor;
    const DynamicColorIOS = require('../PlatformColorValueTypesIOS.ios')
      .DynamicColorIOS;

    it('should normalize iOS PlatformColor colors', () => {
      const color = PlatformColor('systemRedColor');
      const normalizedColor = normalizeColor(color);
      const expectedColor = {semantic: ['systemRedColor']};
      expect(normalizedColor).toEqual(expectedColor);
    });

    it('should normalize iOS Dynamic colors with named colors', () => {
      const color = DynamicColorIOS({light: 'black', dark: 'white'});
      const normalizedColor = normalizeColor(color);
      const expectedColor = {dynamic: {light: 'black', dark: 'white'}};
      expect(normalizedColor).toEqual(expectedColor);
    });

    it('should normalize iOS Dynamic colors with PlatformColor colors', () => {
      const color = DynamicColorIOS({
        light: PlatformColor('systemBlackColor'),
        dark: PlatformColor('systemWhiteColor'),
      });
      const normalizedColor = normalizeColor(color);
      const expectedColor = {
        dynamic: {
          light: {semantic: ['systemBlackColor']},
          dark: {semantic: ['systemWhiteColor']},
        },
      };
      expect(normalizedColor).toEqual(expectedColor);
    });
  }
});

describe('Android', () => {
  if (OS === 'android') {
    const PlatformColor = require('../PlatformColorValueTypes.android')
      .PlatformColor;

    it('should normalize Android PlatformColor colors', () => {
      const color = PlatformColor('?attr/colorPrimary');
      const normalizedColor = normalizeColor(color);
      const expectedColor = {resource_paths: ['?attr/colorPrimary']};
      expect(normalizedColor).toEqual(expectedColor);
    });
  }
});
