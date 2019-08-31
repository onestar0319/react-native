/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {RNTesterTheme} from '../components/RNTesterTheme';

export type RNTesterBackAction = {
  type: 'RNTesterBackAction',
};

export type RNTesterListAction = {
  type: 'RNTesterListAction',
};

export type RNTesterExampleAction = {
  type: 'RNTesterExampleAction',
  openExample: string,
};

export type RNTesterThemeAction = {
  type: 'RNTesterThemeAction',
  theme: RNTesterTheme,
};

export type RNTesterAction =
  | RNTesterBackAction
  | RNTesterListAction
  | RNTesterExampleAction
  | RNTesterThemeAction;

function Back(): RNTesterBackAction {
  return {
    type: 'RNTesterBackAction',
  };
}

function ExampleList(): RNTesterListAction {
  return {
    type: 'RNTesterListAction',
  };
}

function ExampleAction(openExample: string): RNTesterExampleAction {
  return {
    type: 'RNTesterExampleAction',
    openExample,
  };
}

function ThemeAction(theme: RNTesterTheme): RNTesterThemeAction {
  return {
    type: 'RNTesterThemeAction',
    theme,
  };
}

const RNTesterActions = {
  Back,
  ExampleList,
  ExampleAction,
  ThemeAction,
};

module.exports = RNTesterActions;
