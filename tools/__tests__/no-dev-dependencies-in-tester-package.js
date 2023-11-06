/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import fs from 'fs';
import path from 'path';

const CURRENT_DIR = __dirname;
const PATH_TO_TESTER_PACKAGE_MANIFEST = path.join(
  CURRENT_DIR,
  '..',
  '..',
  'packages',
  'rn-tester',
  'package.json',
);

const manifest = JSON.parse(
  fs.readFileSync(PATH_TO_TESTER_PACKAGE_MANIFEST).toString(),
);

describe('@react-native/tester package', () => {
  it('expected not to list any devDependencies', () => {
    expect(manifest).not.toHaveProperty('devDependencies');
  });
});
