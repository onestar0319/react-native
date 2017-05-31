/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const babel = require('babel-core');
const babelRegisterOnly = require('../packager/src/babelRegisterOnly');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const path = require('path');

const nodeFiles = RegExp([
  '/local-cli/',
  '/packager/(?!src/Resolver/polyfills/)',
].join('|'));
const nodeOptions = babelRegisterOnly.config([nodeFiles]);

babelRegisterOnly([]);
// has to be required after setting up babelRegisterOnly
const transformer = require('../packager/src/transformer.js');

module.exports = {
  process(src/*: string*/, file/*: string*/) {
    if (nodeFiles.test(file)) { // node specific transforms only
      return babel.transform(
        src,
        Object.assign({filename: file}, nodeOptions)
      ).code;
    }

    return transformer.transform({
      filename: file,
      localPath: file,
      options: {
        dev: true,
        inlineRequires: true,
        platform: '',
        projectRoot: '',
      },
      src,
    }).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    path.join(__dirname, '../packager/src/transformer.js'),
    require.resolve('babel-core/package.json'),
  ]),
};
