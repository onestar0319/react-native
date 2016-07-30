/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = [
  {
    command: '--entry-file <path>',
    description: 'Path to the root JS file, either absolute or relative to JS root',
  }, {
    command: '--platform [string]',
    description: 'Either "ios" or "android"',
    default: 'ios',
  }, {
    command: '--transformer [string]',
    description: 'Specify a custom transformer to be used (absolute path)',
    default: require.resolve('../../packager/transformer'),
  }, {
    command: '--dev [boolean]',
    description: 'If false, warnings are disabled and the bundle is minified',
    parse: (val) => val === 'false' ? false : true,
    default: true,
  }, {
    command: '--prepack',
    description: 'When passed, the output bundle will use the Prepack format.',
  }, {
    command: '--bridge-config [string]',
    description: 'File name of a a JSON export of __fbBatchedBridgeConfig. Used by Prepack. Ex. ./bridgeconfig.json',
  }, {
    command: '--bundle-output <string>',
    description: 'File name where to store the resulting bundle, ex. /tmp/groups.bundle',
  }, {
    command: '--bundle-encoding [string]',
    description: 'Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer).',
    default: 'utf8',
  }, {
    command: '--sourcemap-output [string]',
    description: 'File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map',
  }, {
    command: '--assets-dest [string]',
    description: 'Directory name where to store assets referenced in the bundle',
  }, {
    command: '--verbose',
    description: 'Enables logging',
    default: false,
  }, {
    command: '--reset-cache',
    description: 'Removes cached files',
    default: false,
  },
];
