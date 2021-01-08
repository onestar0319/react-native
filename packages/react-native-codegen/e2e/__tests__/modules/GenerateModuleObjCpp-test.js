/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const parser = require('../../../src/parsers/flow');
const generator = require('../../../src/generators/modules/GenerateModuleObjCpp');
const fs = require('fs');

import type {SchemaType} from '../../../src/CodegenSchema';

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/modules`;

function getModules(): SchemaType {
  const filenames: Array<string> = fs.readdirSync(FIXTURE_DIR);
  return filenames.reduce<SchemaType>(
    (accumulator, file) => {
      const schema = parser.parseFile(`${FIXTURE_DIR}/${file}`);
      return {
        modules: {
          ...accumulator.modules,
          ...schema.modules,
        },
      };
    },
    {modules: {}},
  );
}

describe('GenerateModuleObjCpp', () => {
  it('can generate a header file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules());
    expect(output.get(libName + '.h')).toMatchSnapshot();
  });

  it('can generate an implementation file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const output = generator.generate(libName, getModules());
    expect(output.get(libName + '-generated.mm')).toMatchSnapshot();
  });
});
