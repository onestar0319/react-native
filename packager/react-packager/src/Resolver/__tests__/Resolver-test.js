/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../')
  .dontMock('underscore');

jest.mock('path');

const Promise = require('promise');
const Resolver = require('../');

const path = require('path');
const _ = require('underscore');

let DependencyGraph = jest.genMockFn();
jest.setMock('node-haste', DependencyGraph);
let Module;
let Polyfill;

describe('Resolver', function() {
  beforeEach(function() {
    DependencyGraph.mockClear();
    Module = jest.genMockFn().mockImpl(function() {
      this.getName = jest.genMockFn();
      this.getDependencies = jest.genMockFn();
      this.isPolyfill = jest.genMockFn().mockReturnValue(false);
    });
    Polyfill = jest.genMockFn().mockImpl(function() {
      var polyfill = new Module();
      polyfill.isPolyfill.mockReturnValue(true);
      return polyfill;
    });

    DependencyGraph.replacePatterns = require.requireActual('node-haste/lib/lib/replacePatterns');
    DependencyGraph.prototype.createPolyfill = jest.genMockFn();
    DependencyGraph.prototype.getDependencies = jest.genMockFn();

    // For the polyfillDeps
    path.join = jest.genMockFn().mockImpl((a, b) => b);

    DependencyGraph.prototype.load = jest.genMockFn().mockImpl(() => Promise.resolve());
  });

  class ResolutionResponseMock {
    constructor({dependencies, mainModuleId}) {
      this.dependencies = dependencies;
      this.mainModuleId = mainModuleId;
    }

    prependDependency(dependency) {
      this.dependencies.unshift(dependency);
    }

    finalize() {
      return Promise.resolve(this);
    }
  }

  function createModule(id, dependencies) {
    var module = new Module({});
    module.getName.mockImpl(() => Promise.resolve(id));
    module.getDependencies.mockImpl(() => Promise.resolve(dependencies));
    return module;
  }

  function createPolyfill(id, dependencies) {
    var polyfill = new Polyfill({});
    polyfill.getName = jest.genMockFn().mockImpl(() => Promise.resolve(id));
    polyfill.getDependencies =
      jest.genMockFn().mockImpl(() => Promise.resolve(dependencies));
    return polyfill;
  }

  describe('getDependencies', function() {
    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(result.dependencies[result.dependencies.length - 1]).toBe(module);
          expect(_.pluck(DependencyGraph.prototype.createPolyfill.mock.calls, 0)).toEqual([
            { file: 'polyfills/polyfills.js',
              id: 'polyfills/polyfills.js',
              dependencies: []
            },
            { id: 'polyfills/console.js',
              file: 'polyfills/console.js',
              dependencies: [
                'polyfills/polyfills.js'
              ],
            },
            { id: 'polyfills/error-guard.js',
              file: 'polyfills/error-guard.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js'
              ],
            },
            { id: 'polyfills/String.prototype.es6.js',
              file: 'polyfills/String.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js'
              ],
            },
            { id: 'polyfills/Array.prototype.es6.js',
              file: 'polyfills/Array.prototype.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
              ],
            },
            { id: 'polyfills/Array.es6.js',
              file: 'polyfills/Array.es6.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
              ],
            },
            { id: 'polyfills/Object.es7.js',
              file: 'polyfills/Object.es7.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
              ],
            },
            { id: 'polyfills/babelHelpers.js',
              file: 'polyfills/babelHelpers.js',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
                'polyfills/Object.es7.js',
              ],
            },
          ]);
        });
    });

    pit('should get dependencies with polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      const polyfill = {};
      DependencyGraph.prototype.createPolyfill.mockReturnValueOnce(polyfill);
      return depResolver.getDependencies('/root/index.js', { dev: true })
        .then(function(result) {
          expect(result.mainModuleId).toEqual('index');
          expect(DependencyGraph.mock.instances[0].getDependencies)
              .toBeCalledWith({entryPath: '/root/index.js', recursive: true});
          expect(result.dependencies[0]).toBe(polyfill);
          expect(result.dependencies[result.dependencies.length - 1])
              .toBe(module);
        });
    });

    pit('should pass in more polyfills', function() {
      var module = createModule('index');
      var deps = [module];

      var depResolver = new Resolver({
        projectRoot: '/root',
        polyfillModuleNames: ['some module'],
      });

      DependencyGraph.prototype.getDependencies.mockImpl(function() {
        return Promise.resolve(new ResolutionResponseMock({
          dependencies: deps,
          mainModuleId: 'index',
        }));
      });

      return depResolver.getDependencies('/root/index.js', { dev: false })
        .then((result) => {
          expect(result.mainModuleId).toEqual('index');
          expect(DependencyGraph.prototype.createPolyfill.mock.calls[result.dependencies.length - 2]).toEqual([
            { file: 'some module',
              id: 'some module',
              dependencies: [
                'polyfills/polyfills.js',
                'polyfills/console.js',
                'polyfills/error-guard.js',
                'polyfills/String.prototype.es6.js',
                'polyfills/Array.prototype.es6.js',
                'polyfills/Array.es6.js',
                'polyfills/Object.es7.js',
                'polyfills/babelHelpers.js',
              ]
            },
          ]);
        });
    });
  });

  describe('wrapModule', function() {
    pit('should resolve modules', function() {
      var depResolver = new Resolver({
        projectRoot: '/root',
      });

      var dependencies = ['x', 'y', 'z', 'a', 'b'];

      /*eslint-disable */
      var code = [
        // single line import
        "import'x';",
        "import 'x';",
        "import 'x' ;",
        "import Default from 'x';",
        "import * as All from 'x';",
        "import {} from 'x';",
        "import { } from 'x';",
        "import {Foo} from 'x';",
        "import { Foo } from 'x';",
        "import { Foo, } from 'x';",
        "import {Foo as Bar} from 'x';",
        "import { Foo as Bar } from 'x';",
        "import { Foo as Bar, } from 'x';",
        "import { Foo, Bar } from 'x';",
        "import { Foo, Bar, } from 'x';",
        "import { Foo as Bar, Baz } from 'x';",
        "import { Foo as Bar, Baz, } from 'x';",
        "import { Foo, Bar as Baz } from 'x';",
        "import { Foo, Bar as Baz, } from 'x';",
        "import { Foo as Bar, Baz as Qux } from 'x';",
        "import { Foo as Bar, Baz as Qux, } from 'x';",
        "import { Foo, Bar, Baz } from 'x';",
        "import { Foo, Bar, Baz, } from 'x';",
        "import { Foo as Bar, Baz, Qux } from 'x';",
        "import { Foo as Bar, Baz, Qux, } from 'x';",
        "import { Foo, Bar as Baz, Qux } from 'x';",
        "import { Foo, Bar as Baz, Qux, } from 'x';",
        "import { Foo, Bar, Baz as Qux } from 'x';",
        "import { Foo, Bar, Baz as Qux, } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "import { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "import { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "import { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "import { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf } from 'x';",
        "import { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'x';",
        "import Default, * as All from 'x';",
        "import Default, { } from 'x';",
        "import Default, { Foo } from 'x';",
        "import Default, { Foo, } from 'x';",
        "import Default, { Foo as Bar } from 'x';",
        "import Default, { Foo as Bar, } from 'x';",
        "import Default, { Foo, Bar } from 'x';",
        "import Default, { Foo, Bar, } from 'x';",
        "import Default, { Foo as Bar, Baz } from 'x';",
        "import Default, { Foo as Bar, Baz, } from 'x';",
        "import Default, { Foo, Bar as Baz } from 'x';",
        "import Default, { Foo, Bar as Baz, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, } from 'x';",
        "import Default, { Foo, Bar, Baz } from 'x';",
        "import Default, { Foo, Bar, Baz, } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux, } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux, } from 'x';",
        "import Default, { Foo, Bar, Baz as Qux } from 'x';",
        "import Default, { Foo, Bar, Baz as Qux, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "import Default, { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "import Default, { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'x';",
        "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'x';",
        "import Default , { } from 'x';",
        'import "x";',
        'import Default from "x";',
        'import * as All from "x";',
        'import { } from "x";',
        'import { Foo } from "x";',
        'import { Foo, } from "x";',
        'import { Foo as Bar } from "x";',
        'import { Foo as Bar, } from "x";',
        'import { Foo, Bar } from "x";',
        'import { Foo, Bar, } from "x";',
        'import { Foo as Bar, Baz } from "x";',
        'import { Foo as Bar, Baz, } from "x";',
        'import { Foo, Bar as Baz } from "x";',
        'import { Foo, Bar as Baz, } from "x";',
        'import { Foo as Bar, Baz as Qux } from "x";',
        'import { Foo as Bar, Baz as Qux, } from "x";',
        'import { Foo, Bar, Baz } from "x";',
        'import { Foo, Bar, Baz, } from "x";',
        'import { Foo as Bar, Baz, Qux } from "x";',
        'import { Foo as Bar, Baz, Qux, } from "x";',
        'import { Foo, Bar as Baz, Qux } from "x";',
        'import { Foo, Bar as Baz, Qux, } from "x";',
        'import { Foo, Bar, Baz as Qux } from "x";',
        'import { Foo, Bar, Baz as Qux, } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'import { Foo as Bar, Baz, Qux as Norf } from "x";',
        'import { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'import { Foo, Bar as Baz, Qux as Norf } from "x";',
        'import { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore } from "x";',
        'import { Foo as Bar, Baz as Qux, Norf as NoMore, } from "x";',
        'import Default, * as All from "x";',
        'import Default, { } from "x";',
        'import Default, { Foo } from "x";',
        'import Default, { Foo, } from "x";',
        'import Default, { Foo as Bar } from "x";',
        'import Default, { Foo as Bar, } from "x";',
        'import Default, { Foo, Bar } from "x";',
        'import Default, { Foo, Bar, } from "x";',
        'import Default, { Foo as Bar, Baz } from "x";',
        'import Default, { Foo as Bar, Baz, } from "x";',
        'import Default, { Foo, Bar as Baz } from "x";',
        'import Default, { Foo, Bar as Baz, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, } from "x";',
        'import Default, { Foo, Bar, Baz } from "x";',
        'import Default, { Foo, Bar, Baz, } from "x";',
        'import Default, { Foo as Bar, Baz, Qux } from "x";',
        'import Default, { Foo as Bar, Baz, Qux, } from "x";',
        'import Default, { Foo, Bar as Baz, Qux } from "x";',
        'import Default, { Foo, Bar as Baz, Qux, } from "x";',
        'import Default, { Foo, Bar, Baz as Qux } from "x";',
        'import Default, { Foo, Bar, Baz as Qux, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'import Default, { Foo as Bar, Baz, Qux as Norf } from "x";',
        'import Default, { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'import Default, { Foo, Bar as Baz, Qux as Norf } from "x";',
        'import Default, { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "x";',
        'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "x";',
        'import Default from "y";',
        'import * as All from \'z\';',
        // import with support for new lines
        "import { Foo,\n Bar }\n from 'x';",
        "import { \nFoo,\nBar,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz\n }\n from 'x';",
        "import { \nFoo as Bar,\n Baz\n, }\n from 'x';",
        "import { Foo,\n Bar as Baz\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz }\n from 'x';",
        "import { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "import { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'x';",
        "import { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'x';",
        "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'x';",
        "import Default,\n * as All from 'x';",
        "import Default,\n { } from 'x';",
        "import Default,\n { Foo\n }\n from 'x';",
        "import Default,\n { Foo,\n }\n from 'x';",
        "import Default,\n { Foo as Bar\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar\n } from\n 'x';",
        "import Default,\n { Foo,\n Bar,\n } from\n 'x';",
        "import Default,\n { Foo as Bar,\n Baz\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "import Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'x';",
        "import Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'x';",
        "import Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'x';",
        "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'x';",
        "import Default\n , { } from 'x';",
        // single line export
        "export'x';",
        "export 'x';",
        "export 'x' ;",
        "export Default from 'x';",
        "export * as All from 'x';",
        "export {} from 'x';",
        "export { } from 'x';",
        "export {Foo} from 'x';",
        "export { Foo } from 'x';",
        "export { Foo, } from 'x';",
        "export {Foo as Bar} from 'x';",
        "export { Foo as Bar } from 'x';",
        "export { Foo as Bar, } from 'x';",
        "export { Foo, Bar } from 'x';",
        "export { Foo, Bar, } from 'x';",
        "export { Foo as Bar, Baz } from 'x';",
        "export { Foo as Bar, Baz, } from 'x';",
        "export { Foo, Bar as Baz } from 'x';",
        "export { Foo, Bar as Baz, } from 'x';",
        "export { Foo as Bar, Baz as Qux } from 'x';",
        "export { Foo as Bar, Baz as Qux, } from 'x';",
        "export { Foo, Bar, Baz } from 'x';",
        "export { Foo, Bar, Baz, } from 'x';",
        "export { Foo as Bar, Baz, Qux } from 'x';",
        "export { Foo as Bar, Baz, Qux, } from 'x';",
        "export { Foo, Bar as Baz, Qux } from 'x';",
        "export { Foo, Bar as Baz, Qux, } from 'x';",
        "export { Foo, Bar, Baz as Qux } from 'x';",
        "export { Foo, Bar, Baz as Qux, } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "export { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "export { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "export { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "export { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf as Enuf } from 'x';",
        "export { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'x';",
        "export Default, * as All from 'x';",
        "export Default, { } from 'x';",
        "export Default, { Foo } from 'x';",
        "export Default, { Foo, } from 'x';",
        "export Default, { Foo as Bar } from 'x';",
        "export Default, { Foo as Bar, } from 'x';",
        "export Default, { Foo, Bar } from 'x';",
        "export Default, { Foo, Bar, } from 'x';",
        "export Default, { Foo as Bar, Baz } from 'x';",
        "export Default, { Foo as Bar, Baz, } from 'x';",
        "export Default, { Foo, Bar as Baz } from 'x';",
        "export Default, { Foo, Bar as Baz, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, } from 'x';",
        "export Default, { Foo, Bar, Baz } from 'x';",
        "export Default, { Foo, Bar, Baz, } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux, } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux, } from 'x';",
        "export Default, { Foo, Bar, Baz as Qux } from 'x';",
        "export Default, { Foo, Bar, Baz as Qux, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf, } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux as Norf } from 'x';",
        "export Default, { Foo as Bar, Baz, Qux as Norf, } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux as Norf } from 'x';",
        "export Default, { Foo, Bar as Baz, Qux as Norf, } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'x';",
        "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'x';",
        "export Default , { } from 'x';",
        'export "x";',
        'export Default from "x";',
        'export * as All from "x";',
        'export { } from "x";',
        'export { Foo } from "x";',
        'export { Foo, } from "x";',
        'export { Foo as Bar } from "x";',
        'export { Foo as Bar, } from "x";',
        'export { Foo, Bar } from "x";',
        'export { Foo, Bar, } from "x";',
        'export { Foo as Bar, Baz } from "x";',
        'export { Foo as Bar, Baz, } from "x";',
        'export { Foo, Bar as Baz } from "x";',
        'export { Foo, Bar as Baz, } from "x";',
        'export { Foo as Bar, Baz as Qux } from "x";',
        'export { Foo as Bar, Baz as Qux, } from "x";',
        'export { Foo, Bar, Baz } from "x";',
        'export { Foo, Bar, Baz, } from "x";',
        'export { Foo as Bar, Baz, Qux } from "x";',
        'export { Foo as Bar, Baz, Qux, } from "x";',
        'export { Foo, Bar as Baz, Qux } from "x";',
        'export { Foo, Bar as Baz, Qux, } from "x";',
        'export { Foo, Bar, Baz as Qux } from "x";',
        'export { Foo, Bar, Baz as Qux, } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'export { Foo as Bar, Baz, Qux as Norf } from "x";',
        'export { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'export { Foo, Bar as Baz, Qux as Norf } from "x";',
        'export { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf as NoMore } from "x";',
        'export { Foo as Bar, Baz as Qux, Norf as NoMore, } from "x";',
        'export Default, * as All from "x";',
        'export Default, { } from "x";',
        'export Default, { Foo } from "x";',
        'export Default, { Foo, } from "x";',
        'export Default, { Foo as Bar } from "x";',
        'export Default, { Foo as Bar, } from "x";',
        'export Default, { Foo, Bar } from "x";',
        'export Default, { Foo, Bar, } from "x";',
        'export Default, { Foo as Bar, Baz } from "x";',
        'export Default, { Foo as Bar, Baz, } from "x";',
        'export Default, { Foo, Bar as Baz } from "x";',
        'export Default, { Foo, Bar as Baz, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, } from "x";',
        'export Default, { Foo, Bar, Baz } from "x";',
        'export Default, { Foo, Bar, Baz, } from "x";',
        'export Default, { Foo as Bar, Baz, Qux } from "x";',
        'export Default, { Foo as Bar, Baz, Qux, } from "x";',
        'export Default, { Foo, Bar as Baz, Qux } from "x";',
        'export Default, { Foo, Bar as Baz, Qux, } from "x";',
        'export Default, { Foo, Bar, Baz as Qux } from "x";',
        'export Default, { Foo, Bar, Baz as Qux, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf, } from "x";',
        'export Default, { Foo as Bar, Baz, Qux as Norf } from "x";',
        'export Default, { Foo as Bar, Baz, Qux as Norf, } from "x";',
        'export Default, { Foo, Bar as Baz, Qux as Norf } from "x";',
        'export Default, { Foo, Bar as Baz, Qux as Norf, } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "x";',
        'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "x";',
        'export Default from "y";',
        'export * as All from \'z\';',
        // export with support for new lines
        "export { Foo,\n Bar }\n from 'x';",
        "export { \nFoo,\nBar,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz\n }\n from 'x';",
        "export { \nFoo as Bar,\n Baz\n, }\n from 'x';",
        "export { Foo,\n Bar as Baz\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz }\n from 'x';",
        "export { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "export { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'x';",
        "export { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'x';",
        "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'x';",
        "export Default,\n * as All from 'x';",
        "export Default,\n { } from 'x';",
        "export Default,\n { Foo\n }\n from 'x';",
        "export Default,\n { Foo,\n }\n from 'x';",
        "export Default,\n { Foo as Bar\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar\n } from\n 'x';",
        "export Default,\n { Foo,\n Bar,\n } from\n 'x';",
        "export Default,\n { Foo as Bar,\n Baz\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'x';",
        "export Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'x';",
        "export Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'x';",
        "export Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'x';",
        "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'x';",
        "export Default\n , { } from 'x';",
        // require
        'require("x")',
        'require("y")',
        'require( \'z\' )',
        'require( "a")',
        'require("b" )',
      ].join('\n');
      /*eslint-disable */

      const module = createModule('test module', ['x', 'y']);

      const resolutionResponse = new ResolutionResponseMock({
        dependencies: [module],
        mainModuleId: 'test module',
      });

      resolutionResponse.getResolvedDependencyPairs = (module) => {
        return [
          ['x', createModule('changed')],
          ['y', createModule('Y')],
        ];
      }

      return depResolver.wrapModule(
        resolutionResponse,
        createModule('test module', ['x', 'y']),
        code
      ).then(processedCode => {
        expect(processedCode.name).toEqual('test module');
        expect(processedCode.code).toEqual([
          '__d(\'test module\',function(global, require,' +
            ' module, exports) {  ' +
            // single line import
            "import'x';",
          "import 'changed';",
          "import 'changed' ;",
          "import Default from 'changed';",
          "import * as All from 'changed';",
          "import {} from 'changed';",
          "import { } from 'changed';",
          "import {Foo} from 'changed';",
          "import { Foo } from 'changed';",
          "import { Foo, } from 'changed';",
          "import {Foo as Bar} from 'changed';",
          "import { Foo as Bar } from 'changed';",
          "import { Foo as Bar, } from 'changed';",
          "import { Foo, Bar } from 'changed';",
          "import { Foo, Bar, } from 'changed';",
          "import { Foo as Bar, Baz } from 'changed';",
          "import { Foo as Bar, Baz, } from 'changed';",
          "import { Foo, Bar as Baz } from 'changed';",
          "import { Foo, Bar as Baz, } from 'changed';",
          "import { Foo as Bar, Baz as Qux } from 'changed';",
          "import { Foo as Bar, Baz as Qux, } from 'changed';",
          "import { Foo, Bar, Baz } from 'changed';",
          "import { Foo, Bar, Baz, } from 'changed';",
          "import { Foo as Bar, Baz, Qux } from 'changed';",
          "import { Foo as Bar, Baz, Qux, } from 'changed';",
          "import { Foo, Bar as Baz, Qux } from 'changed';",
          "import { Foo, Bar as Baz, Qux, } from 'changed';",
          "import { Foo, Bar, Baz as Qux } from 'changed';",
          "import { Foo, Bar, Baz as Qux, } from 'changed';",
          "import { Foo as Bar, Baz as Qux, Norf } from 'changed';",
          "import { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
          "import { Foo as Bar, Baz, Qux as Norf } from 'changed';",
          "import { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
          "import { Foo, Bar as Baz, Qux as Norf } from 'changed';",
          "import { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
          "import { Foo as Bar, Baz as Qux, Norf as Enuf } from 'changed';",
          "import { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'changed';",
          "import Default, * as All from 'changed';",
          "import Default, { } from 'changed';",
          "import Default, { Foo } from 'changed';",
          "import Default, { Foo, } from 'changed';",
          "import Default, { Foo as Bar } from 'changed';",
          "import Default, { Foo as Bar, } from 'changed';",
          "import Default, { Foo, Bar } from 'changed';",
          "import Default, { Foo, Bar, } from 'changed';",
          "import Default, { Foo as Bar, Baz } from 'changed';",
          "import Default, { Foo as Bar, Baz, } from 'changed';",
          "import Default, { Foo, Bar as Baz } from 'changed';",
          "import Default, { Foo, Bar as Baz, } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux, } from 'changed';",
          "import Default, { Foo, Bar, Baz } from 'changed';",
          "import Default, { Foo, Bar, Baz, } from 'changed';",
          "import Default, { Foo as Bar, Baz, Qux } from 'changed';",
          "import Default, { Foo as Bar, Baz, Qux, } from 'changed';",
          "import Default, { Foo, Bar as Baz, Qux } from 'changed';",
          "import Default, { Foo, Bar as Baz, Qux, } from 'changed';",
          "import Default, { Foo, Bar, Baz as Qux } from 'changed';",
          "import Default, { Foo, Bar, Baz as Qux, } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux, Norf } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
          "import Default, { Foo as Bar, Baz, Qux as Norf } from 'changed';",
          "import Default, { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
          "import Default, { Foo, Bar as Baz, Qux as Norf } from 'changed';",
          "import Default, { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'changed';",
          "import Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'changed';",
          "import Default , { } from 'changed';",
          'import "changed";',
          'import Default from "changed";',
          'import * as All from "changed";',
          'import { } from "changed";',
          'import { Foo } from "changed";',
          'import { Foo, } from "changed";',
          'import { Foo as Bar } from "changed";',
          'import { Foo as Bar, } from "changed";',
          'import { Foo, Bar } from "changed";',
          'import { Foo, Bar, } from "changed";',
          'import { Foo as Bar, Baz } from "changed";',
          'import { Foo as Bar, Baz, } from "changed";',
          'import { Foo, Bar as Baz } from "changed";',
          'import { Foo, Bar as Baz, } from "changed";',
          'import { Foo as Bar, Baz as Qux } from "changed";',
          'import { Foo as Bar, Baz as Qux, } from "changed";',
          'import { Foo, Bar, Baz } from "changed";',
          'import { Foo, Bar, Baz, } from "changed";',
          'import { Foo as Bar, Baz, Qux } from "changed";',
          'import { Foo as Bar, Baz, Qux, } from "changed";',
          'import { Foo, Bar as Baz, Qux } from "changed";',
          'import { Foo, Bar as Baz, Qux, } from "changed";',
          'import { Foo, Bar, Baz as Qux } from "changed";',
          'import { Foo, Bar, Baz as Qux, } from "changed";',
          'import { Foo as Bar, Baz as Qux, Norf } from "changed";',
          'import { Foo as Bar, Baz as Qux, Norf, } from "changed";',
          'import { Foo as Bar, Baz, Qux as Norf } from "changed";',
          'import { Foo as Bar, Baz, Qux as Norf, } from "changed";',
          'import { Foo, Bar as Baz, Qux as Norf } from "changed";',
          'import { Foo, Bar as Baz, Qux as Norf, } from "changed";',
          'import { Foo as Bar, Baz as Qux, Norf as NoMore } from "changed";',
          'import { Foo as Bar, Baz as Qux, Norf as NoMore, } from "changed";',
          'import Default, * as All from "changed";',
          'import Default, { } from "changed";',
          'import Default, { Foo } from "changed";',
          'import Default, { Foo, } from "changed";',
          'import Default, { Foo as Bar } from "changed";',
          'import Default, { Foo as Bar, } from "changed";',
          'import Default, { Foo, Bar } from "changed";',
          'import Default, { Foo, Bar, } from "changed";',
          'import Default, { Foo as Bar, Baz } from "changed";',
          'import Default, { Foo as Bar, Baz, } from "changed";',
          'import Default, { Foo, Bar as Baz } from "changed";',
          'import Default, { Foo, Bar as Baz, } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux, } from "changed";',
          'import Default, { Foo, Bar, Baz } from "changed";',
          'import Default, { Foo, Bar, Baz, } from "changed";',
          'import Default, { Foo as Bar, Baz, Qux } from "changed";',
          'import Default, { Foo as Bar, Baz, Qux, } from "changed";',
          'import Default, { Foo, Bar as Baz, Qux } from "changed";',
          'import Default, { Foo, Bar as Baz, Qux, } from "changed";',
          'import Default, { Foo, Bar, Baz as Qux } from "changed";',
          'import Default, { Foo, Bar, Baz as Qux, } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux, Norf } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux, Norf, } from "changed";',
          'import Default, { Foo as Bar, Baz, Qux as Norf } from "changed";',
          'import Default, { Foo as Bar, Baz, Qux as Norf, } from "changed";',
          'import Default, { Foo, Bar as Baz, Qux as Norf } from "changed";',
          'import Default, { Foo, Bar as Baz, Qux as Norf, } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "changed";',
          'import Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "changed";',
          'import Default from "Y";',
          'import * as All from \'z\';',
          // import with support for new lines
          "import { Foo,\n Bar }\n from 'changed';",
          "import { \nFoo,\nBar,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz\n }\n from 'changed';",
          "import { \nFoo as Bar,\n Baz\n, }\n from 'changed';",
          "import { Foo,\n Bar as Baz\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "import { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'changed';",
          "import { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'changed';",
          "import { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'changed';",
          "import Default,\n * as All from 'changed';",
          "import Default,\n { } from 'changed';",
          "import Default,\n { Foo\n }\n from 'changed';",
          "import Default,\n { Foo,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar\n } from\n 'changed';",
          "import Default,\n { Foo,\n Bar,\n } from\n 'changed';",
          "import Default,\n { Foo as Bar,\n Baz\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "import Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'changed';",
          "import Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'changed';",
          "import Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'changed';",
          "import Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'changed';",
          "import Default\n , { } from 'changed';",
          // single line export
          "export'x';",
          "export 'changed';",
          "export 'changed' ;",
          "export Default from 'changed';",
          "export * as All from 'changed';",
          "export {} from 'changed';",
          "export { } from 'changed';",
          "export {Foo} from 'changed';",
          "export { Foo } from 'changed';",
          "export { Foo, } from 'changed';",
          "export {Foo as Bar} from 'changed';",
          "export { Foo as Bar } from 'changed';",
          "export { Foo as Bar, } from 'changed';",
          "export { Foo, Bar } from 'changed';",
          "export { Foo, Bar, } from 'changed';",
          "export { Foo as Bar, Baz } from 'changed';",
          "export { Foo as Bar, Baz, } from 'changed';",
          "export { Foo, Bar as Baz } from 'changed';",
          "export { Foo, Bar as Baz, } from 'changed';",
          "export { Foo as Bar, Baz as Qux } from 'changed';",
          "export { Foo as Bar, Baz as Qux, } from 'changed';",
          "export { Foo, Bar, Baz } from 'changed';",
          "export { Foo, Bar, Baz, } from 'changed';",
          "export { Foo as Bar, Baz, Qux } from 'changed';",
          "export { Foo as Bar, Baz, Qux, } from 'changed';",
          "export { Foo, Bar as Baz, Qux } from 'changed';",
          "export { Foo, Bar as Baz, Qux, } from 'changed';",
          "export { Foo, Bar, Baz as Qux } from 'changed';",
          "export { Foo, Bar, Baz as Qux, } from 'changed';",
          "export { Foo as Bar, Baz as Qux, Norf } from 'changed';",
          "export { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
          "export { Foo as Bar, Baz, Qux as Norf } from 'changed';",
          "export { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
          "export { Foo, Bar as Baz, Qux as Norf } from 'changed';",
          "export { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
          "export { Foo as Bar, Baz as Qux, Norf as Enuf } from 'changed';",
          "export { Foo as Bar, Baz as Qux, Norf as Enuf, } from 'changed';",
          "export Default, * as All from 'changed';",
          "export Default, { } from 'changed';",
          "export Default, { Foo } from 'changed';",
          "export Default, { Foo, } from 'changed';",
          "export Default, { Foo as Bar } from 'changed';",
          "export Default, { Foo as Bar, } from 'changed';",
          "export Default, { Foo, Bar } from 'changed';",
          "export Default, { Foo, Bar, } from 'changed';",
          "export Default, { Foo as Bar, Baz } from 'changed';",
          "export Default, { Foo as Bar, Baz, } from 'changed';",
          "export Default, { Foo, Bar as Baz } from 'changed';",
          "export Default, { Foo, Bar as Baz, } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux, } from 'changed';",
          "export Default, { Foo, Bar, Baz } from 'changed';",
          "export Default, { Foo, Bar, Baz, } from 'changed';",
          "export Default, { Foo as Bar, Baz, Qux } from 'changed';",
          "export Default, { Foo as Bar, Baz, Qux, } from 'changed';",
          "export Default, { Foo, Bar as Baz, Qux } from 'changed';",
          "export Default, { Foo, Bar as Baz, Qux, } from 'changed';",
          "export Default, { Foo, Bar, Baz as Qux } from 'changed';",
          "export Default, { Foo, Bar, Baz as Qux, } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux, Norf } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux, Norf, } from 'changed';",
          "export Default, { Foo as Bar, Baz, Qux as Norf } from 'changed';",
          "export Default, { Foo as Bar, Baz, Qux as Norf, } from 'changed';",
          "export Default, { Foo, Bar as Baz, Qux as Norf } from 'changed';",
          "export Default, { Foo, Bar as Baz, Qux as Norf, } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore } from 'changed';",
          "export Default, { Foo as Bar, Baz as Qux, Norf as NoMore, } from 'changed';",
          "export Default , { } from 'changed';",
          'export "changed";',
          'export Default from "changed";',
          'export * as All from "changed";',
          'export { } from "changed";',
          'export { Foo } from "changed";',
          'export { Foo, } from "changed";',
          'export { Foo as Bar } from "changed";',
          'export { Foo as Bar, } from "changed";',
          'export { Foo, Bar } from "changed";',
          'export { Foo, Bar, } from "changed";',
          'export { Foo as Bar, Baz } from "changed";',
          'export { Foo as Bar, Baz, } from "changed";',
          'export { Foo, Bar as Baz } from "changed";',
          'export { Foo, Bar as Baz, } from "changed";',
          'export { Foo as Bar, Baz as Qux } from "changed";',
          'export { Foo as Bar, Baz as Qux, } from "changed";',
          'export { Foo, Bar, Baz } from "changed";',
          'export { Foo, Bar, Baz, } from "changed";',
          'export { Foo as Bar, Baz, Qux } from "changed";',
          'export { Foo as Bar, Baz, Qux, } from "changed";',
          'export { Foo, Bar as Baz, Qux } from "changed";',
          'export { Foo, Bar as Baz, Qux, } from "changed";',
          'export { Foo, Bar, Baz as Qux } from "changed";',
          'export { Foo, Bar, Baz as Qux, } from "changed";',
          'export { Foo as Bar, Baz as Qux, Norf } from "changed";',
          'export { Foo as Bar, Baz as Qux, Norf, } from "changed";',
          'export { Foo as Bar, Baz, Qux as Norf } from "changed";',
          'export { Foo as Bar, Baz, Qux as Norf, } from "changed";',
          'export { Foo, Bar as Baz, Qux as Norf } from "changed";',
          'export { Foo, Bar as Baz, Qux as Norf, } from "changed";',
          'export { Foo as Bar, Baz as Qux, Norf as NoMore } from "changed";',
          'export { Foo as Bar, Baz as Qux, Norf as NoMore, } from "changed";',
          'export Default, * as All from "changed";',
          'export Default, { } from "changed";',
          'export Default, { Foo } from "changed";',
          'export Default, { Foo, } from "changed";',
          'export Default, { Foo as Bar } from "changed";',
          'export Default, { Foo as Bar, } from "changed";',
          'export Default, { Foo, Bar } from "changed";',
          'export Default, { Foo, Bar, } from "changed";',
          'export Default, { Foo as Bar, Baz } from "changed";',
          'export Default, { Foo as Bar, Baz, } from "changed";',
          'export Default, { Foo, Bar as Baz } from "changed";',
          'export Default, { Foo, Bar as Baz, } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux, } from "changed";',
          'export Default, { Foo, Bar, Baz } from "changed";',
          'export Default, { Foo, Bar, Baz, } from "changed";',
          'export Default, { Foo as Bar, Baz, Qux } from "changed";',
          'export Default, { Foo as Bar, Baz, Qux, } from "changed";',
          'export Default, { Foo, Bar as Baz, Qux } from "changed";',
          'export Default, { Foo, Bar as Baz, Qux, } from "changed";',
          'export Default, { Foo, Bar, Baz as Qux } from "changed";',
          'export Default, { Foo, Bar, Baz as Qux, } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux, Norf } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux, Norf, } from "changed";',
          'export Default, { Foo as Bar, Baz, Qux as Norf } from "changed";',
          'export Default, { Foo as Bar, Baz, Qux as Norf, } from "changed";',
          'export Default, { Foo, Bar as Baz, Qux as Norf } from "changed";',
          'export Default, { Foo, Bar as Baz, Qux as Norf, } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf } from "changed";',
          'export Default, { Foo as Bar, Baz as Qux, Norf as Enuf, } from "changed";',
          'export Default from "Y";',
          'export * as All from \'z\';',
          // export with support for new lines
          "export { Foo,\n Bar }\n from 'changed';",
          "export { \nFoo,\nBar,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz\n }\n from 'changed';",
          "export { \nFoo as Bar,\n Baz\n, }\n from 'changed';",
          "export { Foo,\n Bar as Baz\n }\n from 'changed';",
          "export { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "export { Foo,\n Bar,\n Baz }\n from 'changed';",
          "export { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "export { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "export { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "export { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "export { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz,\n Qux as Norf\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz,\n Qux as Norf,\n }\n from 'changed';",
          "export { Foo,\n Bar as Baz,\n Qux as Norf\n }\n from 'changed';",
          "export { Foo,\n Bar as Baz,\n Qux as Norf,\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf\n }\n from 'changed';",
          "export { Foo as Bar,\n Baz as Qux,\n Norf as Enuf,\n }\n from 'changed';",
          "export Default,\n * as All from 'changed';",
          "export Default,\n { } from 'changed';",
          "export Default,\n { Foo\n }\n from 'changed';",
          "export Default,\n { Foo,\n }\n from 'changed';",
          "export Default,\n { Foo as Bar\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar\n } from\n 'changed';",
          "export Default,\n { Foo,\n Bar,\n } from\n 'changed';",
          "export Default,\n { Foo as Bar,\n Baz\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz,\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar as Baz\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar as Baz,\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux,\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar,\n Baz\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar,\n Baz,\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz,\n Qux\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz,\n Qux,\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar as Baz,\n Qux\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar as Baz,\n Qux,\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar,\n Baz as Qux\n }\n from 'changed';",
          "export Default,\n { Foo,\n Bar,\n Baz as Qux,\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf,\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz,\n Qux as Norf, }\n from 'changed';",
          "export Default,\n { Foo, Bar as Baz,\n Qux as Norf }\n from 'changed';",
          "export Default,\n { Foo, Bar as Baz,\n Qux as Norf, }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore\n }\n from 'changed';",
          "export Default,\n { Foo as Bar,\n Baz as Qux,\n Norf as NoMore,\n }\n from 'changed';",
          "export Default\n , { } from 'changed';",
          // require
          'require("changed")',
          'require("Y")',
          'require( \'z\' )',
          'require( "a")',
          'require("b" )',
          '});',
        ].join('\n'));
      });
    });

    pit('should resolve polyfills', function () {
      const depResolver = new Resolver({
        projectRoot: '/root',
      });
      const polyfill = createPolyfill('test polyfill', []);
      const code = [
        'global.fetch = () => 1;',
      ].join('');
      return depResolver.wrapModule(
        null,
        polyfill,
        code
      ).then(processedCode => {
        expect(processedCode.code).toEqual([
          '(function(global) {',
          'global.fetch = () => 1;',
          "\n})(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);",
        ].join(''));
      });
    });
  });
});
