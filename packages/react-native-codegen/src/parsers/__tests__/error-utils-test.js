/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

'use strict';

const {
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfUnusedModuleInterfaceParserError,
} = require('../error-utils');
const {
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UnusedModuleInterfaceParserError,
} = require('../errors');

describe('throwIfModuleInterfaceNotFound', () => {
  it('throw error if there are zero module specs', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceNotFound(0, nativeModuleName, specId, parserType);
    }).toThrow(ModuleInterfaceNotFoundParserError);
  });

  it("don't throw error if there is at least one module spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceNotFound(1, nativeModuleName, specId, parserType);
    }).not.toThrow(ModuleInterfaceNotFoundParserError);
  });
});

describe('throwIfMoreThanOneModuleRegistryCalls', () => {
  it('throw error if module registry calls more than one', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [
      {name: 'callExpression1'},
      {name: 'callExpression2'},
    ];
    const parserType = 'Flow';

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
        parserType,
      );
    }).toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
  it("don't throw error if single module registry call", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];
    const parserType = 'TypeScript';

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
        parserType,
      );
    }).not.toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
});

describe('throwIfUnusedModuleInterfaceParserError', () => {
  it('throw error if unused module', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [];
    const spec = {name: 'Spec'};
    const parserType = 'Flow';
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
        parserType,
      );
    }).toThrow(UnusedModuleInterfaceParserError);
  });

  it("don't throw error if module is used", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];
    const spec = {name: 'Spec'};
    const parserType = 'TypeScript';
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
        parserType,
      );
    }).not.toThrow(UnusedModuleInterfaceParserError);
  });
});
