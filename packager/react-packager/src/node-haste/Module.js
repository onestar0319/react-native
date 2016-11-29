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

const GlobalTransformCache = require('../lib/GlobalTransformCache');
const TransformCache = require('../lib/TransformCache');

const chalk = require('chalk');
const crypto = require('crypto');
const docblock = require('./DependencyGraph/docblock');
const invariant = require('invariant');
const isAbsolutePath = require('absolute-path');
const jsonStableStringify = require('json-stable-stringify');

const {join: joinPath, relative: relativePath, extname} = require('path');

import type {TransformedCode, Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {ReadTransformProps} from '../lib/TransformCache';
import type Cache from './Cache';
import type DependencyGraphHelpers from './DependencyGraph/DependencyGraphHelpers';
import type ModuleCache from './ModuleCache';
import type FastFs from './fastfs';

type ReadResult = {
  code?: string,
  dependencies?: ?Array<string>,
  dependencyOffsets?: ?Array<number>,
  map?: ?{},
};

export type TransformCode = (
  module: Module,
  sourceCode: string,
  transformOptions: TransformOptions,
) => Promise<TransformedCode>;

export type Options = {
  resetCache?: boolean,
  cacheTransformResults?: boolean,
};

export type ConstructorArgs = {
  file: string,
  fastfs: FastFs,
  moduleCache: ModuleCache,
  cache: Cache,
  transformCode: ?TransformCode,
  transformCacheKey: ?string,
  depGraphHelpers: DependencyGraphHelpers,
  options: Options,
};

class Module {

  path: string;
  type: string;

  _fastfs: FastFs;
  _moduleCache: ModuleCache;
  _cache: Cache;
  _transformCode: ?TransformCode;
  _transformCacheKey: ?string;
  _depGraphHelpers: DependencyGraphHelpers;
  _options: Options;

  _docBlock: Promise<{id?: string, moduleDocBlock: {[key: string]: mixed}}>;
  _readSourceCodePromise: Promise<string>;
  _readPromises: Map<string, Promise<ReadResult>>;

  static _useGlobalCache: boolean;

  constructor({
    file,
    fastfs,
    moduleCache,
    cache,
    transformCode,
    transformCacheKey,
    depGraphHelpers,
    options,
  }: ConstructorArgs) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = file;
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
    this._transformCode = transformCode;
    this._transformCacheKey = transformCacheKey;
    invariant(
      transformCode == null || transformCacheKey != null,
      'missing transform cache key',
    );
    this._depGraphHelpers = depGraphHelpers;
    this._options = options || {};

    this._readPromises = new Map();
  }

  isHaste(): Promise<boolean> {
    return this._cache.get(
      this.path,
      'isHaste',
      () => this._readDocBlock().then(({id}) => !!id)
    );
  }

  getCode(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({code}) => code);
  }

  getMap(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({map}) => map);
  }

  getName(): Promise<string | number> {
    return this._cache.get(
      this.path,
      'name',
      () => this._readDocBlock().then(({id}) => {
        if (id) {
          return id;
        }

        const p = this.getPackage();

        if (!p) {
          // Name is full path
          return this.path;
        }

        return p.getName()
          .then(name => {
            if (!name) {
              return this.path;
            }

            return joinPath(name, relativePath(p.root, this.path)).replace(/\\/g, '/');
          });
      })
    );
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({dependencies}) => dependencies);
  }

  /**
   * We don't need to invalidate the TranformCache itself because it guarantees
   * itself that if a source code changed we won't return the cached transformed
   * code.
   */
  invalidate() {
    this._cache.invalidate(this.path);
    this._readPromises.clear();
  }

  _parseDocBlock(docBlock) {
    // Extract an id for the module if it's using @providesModule syntax
    // and if it's NOT in node_modules (and not a whitelisted node_module).
    // This handles the case where a project may have a dep that has @providesModule
    // docblock comments, but doesn't want it to conflict with whitelisted @providesModule
    // modules, such as react-haste, fbjs-haste, or react-native or with non-dependency,
    // project-specific code that is using @providesModule.
    const moduleDocBlock = docblock.parseAsObject(docBlock);
    const provides = moduleDocBlock.providesModule || moduleDocBlock.provides;

    const id = provides && !this._depGraphHelpers.isNodeModulesDir(this.path)
        ? /^\S+/.exec(provides)[0]
        : undefined;
    return {id, moduleDocBlock};
  }

  _readSourceCode() {
    if (!this._readSourceCodePromise) {
      this._readSourceCodePromise = this._fastfs.readFile(this.path);
    }
    return this._readSourceCodePromise;
  }

  _readDocBlock() {
    if (!this._docBlock) {
      this._docBlock = this._readSourceCode()
        .then(docBlock => this._parseDocBlock(docBlock));
    }
    return this._docBlock;
  }

  /**
   * To what we read from the cache or worker, we need to add id and source.
   */
  _finalizeReadResult(
    source: string,
    id?: string,
    extern: boolean,
    result: TransformedCode,
  ) {
    if (this._options.cacheTransformResults === false) {
      const {dependencies} = result;
      return {dependencies};
    }
    return {...result, id, source};
  }

  _transformCodeForCallback(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    const {_transformCode} = this;
    invariant(_transformCode != null, 'missing code transform funtion');
    const {sourceCode, transformOptions} = cacheProps;
    return _transformCode(this, sourceCode, transformOptions).then(
      freshResult => process.nextTick(callback, undefined, freshResult),
      error => process.nextTick(callback, error),
    );
  }

  _getTransformedCode(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    const globalCache = GlobalTransformCache.get();
    if (!Module._useGlobalCache || globalCache == null) {
      this._transformCodeForCallback(cacheProps, callback);
      return;
    }
    globalCache.fetch(cacheProps, (globalCacheError, globalCachedResult) => {
      if (globalCacheError != null && Module._useGlobalCache) {
        console.log(chalk.red(
          '\nWarning: the global cache failed with error:',
        ));
        console.log(chalk.red(globalCacheError.stack));
        console.log(chalk.red(
          'The global cache will be DISABLED for the ' +
            'remainder of the transformation.',
        ));
        Module._useGlobalCache = false;
      }
      if (globalCacheError != null || globalCachedResult == null) {
        this._transformCodeForCallback(cacheProps, callback);
        return;
      }
      callback(undefined, globalCachedResult);
    });
  }

  _getAndCacheTransformedCode(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    this._getTransformedCode(cacheProps, (error, result) => {
      if (error) {
        callback(error);
        return;
      }
      invariant(result != null, 'missing result');
      TransformCache.writeSync({...cacheProps, result});
      callback(undefined, result);
    });
  }

  /**
   * Read everything about a module: source code, transformed code,
   * dependencies, etc. The overall process is to read the cache first, and if
   * it's a miss, we let the worker write to the cache and read it again.
   */
  read(transformOptions: TransformOptions): Promise<ReadResult> {
    const key = stableObjectHash(transformOptions || {});
    const promise = this._readPromises.get(key);
    if (promise != null) {
      return promise;
    }
    const freshPromise = Promise.all([
      this._readSourceCode(),
      this._readDocBlock(),
    ]).then(([sourceCode, {id, moduleDocBlock}]) => {
      // Ignore requires in JSON files or generated code. An example of this
      // is prebuilt files like the SourceMap library.
      const extern = this.isJSON() || 'extern' in moduleDocBlock;
      if (extern) {
        transformOptions = {...transformOptions, extern};
      }
      const transformCacheKey = this._transformCacheKey;
      invariant(transformCacheKey != null, 'missing transform cache key');
      const cacheProps = {
        filePath: this.path,
        sourceCode,
        transformCacheKey,
        transformOptions,
        cacheOptions: this._options,
      };
      const cachedResult = TransformCache.readSync(cacheProps);
      if (cachedResult) {
        return Promise.resolve(this._finalizeReadResult(sourceCode, id, extern, cachedResult));
      }
      return new Promise((resolve, reject) => {
        this._getAndCacheTransformedCode(
          cacheProps,
          (transformError, freshResult) => {
            if (transformError) {
              reject(transformError);
              return;
            }
            invariant(freshResult != null, 'inconsistent state');
            resolve(this._finalizeReadResult(sourceCode, id, extern, freshResult));
          },
        );
      });
    });
    this._readPromises.set(key, freshPromise);
    return freshPromise;
  }

  hash() {
    return `Module : ${this.path}`;
  }

  isJSON() {
    return extname(this.path) === '.json';
  }

  isAsset() {
    return false;
  }

  isPolyfill() {
    return false;
  }

  toJSON() {
    return {
      hash: this.hash(),
      isJSON: this.isJSON(),
      isAsset: this.isAsset(),
      type: this.type,
      path: this.path,
    };
  }
}

Module._useGlobalCache = true;

// use weak map to speed up hash creation of known objects
const knownHashes = new WeakMap();
function stableObjectHash(object) {
  let digest = knownHashes.get(object);
  if (!digest) {
    digest = crypto.createHash('md5')
      .update(jsonStableStringify(object))
      .digest('base64');
    knownHashes.set(object, digest);
  }

  return digest;
}

module.exports = Module;
