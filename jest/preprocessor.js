/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

/* eslint-env node */

'use strict';

const metroBabelRegister = require('metro-babel-register');
const createCacheKeyFunction =
  require('@jest/create-cache-key-function').default;

const {transformSync: babelTransformSync} = require('@babel/core');
const generate = require('@babel/generator').default;

// Files matching this pattern will be transformed with the Node JS Babel
// transformer, rather than with the React Native Babel transformer. Scripts
// intended to run through Node JS should be included here.
const nodeFiles = /[\\/]metro(?:-[^/]*)[\\/]/;

// Get Babel config from metro-babel-register, without registering a require
// hook. This is used below to configure babelTransformSync under Jest.
const {only: _, ...nodeBabelOptions} = metroBabelRegister.config([]);

// Register Babel to allow the transformer itself to be loaded from source.
if (process.env.FBSOURCE_ENV) {
  // Internal: Use `@fb-scripts/babel-register` to re-use internal
  // registration, rather than potentially clobbering it and conflicting with
  // other Jest projects running in the same process.
  // This package should *NOT* be a dependency of `@react-native/monorepo`.
  // $FlowIgnore[cannot-resolve-module]
  require('@fb-scripts/babel-register');
} else {
  metroBabelRegister([nodeFiles]);
}
const transformer = require('metro-react-native-babel-transformer');

module.exports = {
  process(src /*: string */, file /*: string */) /*: {code: string, ...} */ {
    if (nodeFiles.test(file)) {
      // node specific transforms only
      return babelTransformSync(src, {
        filename: file,
        sourceType: 'script',
        ...nodeBabelOptions,
        ast: false,
      });
    }

    const {ast} = transformer.transform({
      filename: file,
      options: {
        ast: true, // needed for open source (?) https://github.com/facebook/react-native/commit/f8d6b97140cffe8d18b2558f94570c8d1b410d5c#r28647044
        dev: true,
        enableBabelRuntime: false,
        experimentalImportSupport: false,
        globalPrefix: '',
        hot: false,
        inlineRequires: true,
        minify: false,
        platform: '',
        projectRoot: '',
        publicPath: '/assets',
        retainLines: true,
        sourceType: 'unambiguous', // b7 required. detects module vs script mode
      },
      src,
    });

    return generate(
      ast,
      // $FlowFixMe[prop-missing] Error found when improving flow typing for libs
      {
        code: true,
        comments: false,
        compact: false,
        filename: file,
        retainLines: true,
        sourceFileName: file,
        sourceMaps: true,
      },
      src,
    );
  },

  getCacheKey: (createCacheKeyFunction([
    __filename,
    require.resolve('metro-react-native-babel-transformer'),
    require.resolve('@babel/core/package.json'),
  ]) /*: any */),
};
