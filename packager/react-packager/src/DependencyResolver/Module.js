/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const crypto = require('crypto');
const docblock = require('./DependencyGraph/docblock');
const isAbsolutePath = require('absolute-path');
const jsonStableStringify = require('json-stable-stringify');
const path = require('fast-path');
const extractRequires = require('./lib/extractRequires');

class Module {

  constructor({
    file,
    fastfs,
    moduleCache,
    cache,
    extractor = extractRequires,
    transformCode,
    depGraphHelpers,
  }) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = file;
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
    this._extractor = extractor;
    this._transformCode = transformCode;
    this._depGraphHelpers = depGraphHelpers;
  }

  isHaste() {
    return this._cache.get(
      this.path,
      'isHaste',
      () => this._readDocBlock().then(({id}) => !!id)
    );
  }

  getCode(transformOptions) {
    return this.read(transformOptions).then(({code}) => code);
  }

  getMap(transformOptions) {
    return this.read(transformOptions).then(({map}) => map);
  }

  getName() {
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

            return path.join(name, path.relative(p.root, this.path)).replace(/\\/g, '/');
          });
      })
    );
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies(transformOptions) {
    return this.read(transformOptions).then(data => data.dependencies);
  }

  invalidate() {
    this._cache.invalidate(this.path);
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

  _readDocBlock(contentPromise) {
    if (!this._docBlock) {
      if (!contentPromise) {
        contentPromise = this._fastfs.readWhile(this.path, whileInDocBlock);
      }
      this._docBlock = contentPromise
        .then(docBlock => this._parseDocBlock(docBlock));
    }
    return this._docBlock;
  }

  read(transformOptions) {
    return this._cache.get(
      this.path,
      cacheKey('moduleData', transformOptions),
      () => {
        const fileContentPromise = this._fastfs.readFile(this.path);
        return Promise.all([
          fileContentPromise,
          this._readDocBlock(fileContentPromise),
        ]).then(([code, {id, moduleDocBlock}]) => {
          // Ignore requires in JSON files or generated code. An example of this
          // is prebuilt files like the SourceMap library.
          if (this.isJSON() || 'extern' in moduleDocBlock) {
            return {id, code, dependencies: []};
          } else {
            const transformCode = this._transformCode;
            const codePromise = transformCode
                ? transformCode(this, code, transformOptions)
                : Promise.resolve({code});

            return codePromise.then(({code, dependencies, map}) => {
              if (!dependencies) {
                dependencies = this._extractor(code).deps.sync;
              }
              return {id, code, dependencies, map};
            });
          }
        });
      }
    );
  }

  hash() {
    return `Module : ${this.path}`;
  }

  isJSON() {
    return path.extname(this.path) === '.json';
  }

  isAsset() {
    return false;
  }

  isPolyfill() {
    return false;
  }

  isAsset_DEPRECATED() {
    return false;
  }

  toJSON() {
    return {
      hash: this.hash(),
      isJSON: this.isJSON(),
      isAsset: this.isAsset(),
      isAsset_DEPRECATED: this.isAsset_DEPRECATED(),
      type: this.type,
      path: this.path,
    };
  }
}

function whileInDocBlock(chunk, i, result) {
  // consume leading whitespace
  if (!/\S/.test(result)) {
    return true;
  }

  // check for start of doc block
  if (!/^\s*\/(\*{2}|\*?$)/.test(result)) {
    return false;
  }

  // check for end of doc block
  return !/\*\//.test(result);
}

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

function cacheKey(field, transformOptions) {
  return transformOptions !== undefined
      ? stableObjectHash(transformOptions) + '\0' + field
      : field;
}

module.exports = Module;
