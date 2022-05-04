/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const rnCodegen = require('../RNCodegen.js');
const fixture = require('../__test_fixtures__/fixtures.js');
const path = require('path');

const invalidDirectory = 'invalid/';
const packageName = 'na';
const componentsOutputDir = 'react/renderer/components/library';
const modulesOutputDir = 'library';

describe('RNCodegen.generate', () => {
  it('when type `all`', () => {
    const expectedPaths = {
      'library.h': modulesOutputDir,
      'library-generated.mm': modulesOutputDir,
      'ShadowNodes.h': componentsOutputDir,
      'ShadowNodes.cpp': componentsOutputDir,
      'Props.h': componentsOutputDir,
      'Props.cpp': componentsOutputDir,
      'RCTComponentViewHelpers.h': componentsOutputDir,
      'EventEmitters.h': componentsOutputDir,
      'EventEmitters.cpp': componentsOutputDir,
      'ComponentDescriptors.h': componentsOutputDir,
    };

    jest.mock('fs', () => ({
      existsSync: location => {
        return true;
      },
      writeFileSync: (location, content) => {
        let receivedDir = path.dirname(location);
        let receivedBasename = path.basename(location);

        let expectedPath = expectedPaths[receivedBasename];
        expect(receivedDir).toEqual(expectedPath);
      },
    }));

    const res = rnCodegen.generate(
      {
        libraryName: 'library',
        schema: fixture.all,
        outputDirectory: invalidDirectory,
        packageName: packageName,
        assumeNonnull: true,
        componentsOutputDir: componentsOutputDir,
        modulesOutputDir: modulesOutputDir,
      },
      {
        generators: ['componentsIOS', 'modulesIOS'],
        test: false,
      },
    );

    expect(res).toBeTruthy();
  });
});
