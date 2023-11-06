/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const forEachPackage = require('../for-each-package');
const {readdirSync, readFileSync} = require('fs');
const path = require('path');

jest.mock('fs', () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('forEachPackage', () => {
  it('executes callback call with parameters', () => {
    const callback = jest.fn();
    const mockedPackageManifest = '{"name": "my-new-package"}';
    const mockedParsedPackageManifest = JSON.parse(mockedPackageManifest);
    const mockedPackageName = 'my-new-package';

    readdirSync.mockImplementationOnce(() => [
      {name: mockedPackageName, isDirectory: () => true},
    ]);
    readFileSync.mockImplementationOnce(() => mockedPackageManifest);

    forEachPackage(callback);

    expect(callback).toHaveBeenCalledWith(
      path.join(__dirname, '..', '..', '..', 'packages', mockedPackageName),
      path.join('packages', mockedPackageName),
      mockedParsedPackageManifest,
    );
  });

  it('filters react-native folder by default', () => {
    const callback = jest.fn();
    readdirSync.mockImplementationOnce(() => [
      {name: 'react-native', isDirectory: () => true},
    ]);

    forEachPackage(callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('includes react-native, if such option is provided', () => {
    const callback = jest.fn();
    const mockedPackageManifest = '{"name": "react-native"}';
    const mockedParsedPackageManifest = JSON.parse(mockedPackageManifest);
    const mockedPackageName = 'react-native';

    readdirSync.mockImplementationOnce(() => [
      {name: 'react-native', isDirectory: () => true},
    ]);
    readFileSync.mockImplementationOnce(() => mockedPackageManifest);

    forEachPackage(callback, {includeReactNative: true});

    expect(callback).toHaveBeenCalledWith(
      path.join(__dirname, '..', '..', '..', 'packages', mockedPackageName),
      path.join('packages', mockedPackageName),
      mockedParsedPackageManifest,
    );
  });
});
