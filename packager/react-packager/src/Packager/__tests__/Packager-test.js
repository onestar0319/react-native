/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .setMock('worker-farm', function() { return function() {};})
  .dontMock('underscore')
  .dontMock('../../lib/ModuleTransport')
  .setMock('uglify-js')
  .dontMock('../');

jest.mock('fs');

var Promise = require('bluebird');

describe('Packager', function() {
  var getDependencies;
  var wrapModule;
  var Packager;

  beforeEach(function() {
    getDependencies = jest.genMockFn();
    wrapModule = jest.genMockFn();
    require('../../DependencyResolver').mockImpl(function() {
      return {
        getDependencies: getDependencies,
        wrapModule: wrapModule,
      };
    });

    Packager = require('../');
  });

  pit('create a package', function() {
    require('fs').statSync.mockImpl(function() {
      return {
        isDirectory: function() {return true;}
      };
    });


    require('fs').readFile.mockImpl(function(file, callback) {
      callback(null, '{"json":true}');
    });

    var assetServer = {
      getAssetData: jest.genMockFn(),
    };

    var packager = new Packager({
      projectRoots: ['/root'],
      assetServer: assetServer,
    });

    var modules = [
      {id: 'foo', path: '/root/foo.js', dependencies: []},
      {id: 'bar', path: '/root/bar.js', dependencies: []},
      {
        id: 'image!img',
        path: '/root/img/img.png',
        isAsset_DEPRECATED: true,
        dependencies: [],
        resolution: 2,
      },
      {
        id: 'new_image.png',
        path: '/root/img/new_image.png',
        isAsset: true,
        resolution: 2,
        dependencies: []
      },
      {
        id: 'package/file.json',
        path: '/root/file.json',
        isJSON: true,
        dependencies: [],
      },
    ];

    getDependencies.mockImpl(function() {
      return Promise.resolve({
        mainModuleId: 'foo',
        dependencies: modules
      });
    });

    require('../../JSTransformer').prototype.loadFileAndTransform
      .mockImpl(function(path) {
        return Promise.resolve({
          code: 'transformed ' + path,
          map: 'sourcemap ' + path,
          sourceCode: 'source ' + path,
          sourcePath: path
        });
      });

    wrapModule.mockImpl(function(module, code) {
      return 'lol ' + code + ' lol';
    });

    require('image-size').mockImpl(function(path, cb) {
      cb(null, { width: 50, height: 100 });
    });

    assetServer.getAssetData.mockImpl(function() {
      return {
        scales: [1,2,3],
        hash: 'i am a hash',
        name: 'img',
        type: 'png',
      };
    });

    return packager.package('/root/foo.js', true, 'source_map_url')
      .then(function(p) {
        expect(p.addModule.mock.calls[0][0]).toEqual({
          code: 'lol transformed /root/foo.js lol',
          map: 'sourcemap /root/foo.js',
          sourceCode: 'source /root/foo.js',
          sourcePath: '/root/foo.js',
        });

        expect(p.addModule.mock.calls[1][0]).toEqual({
          code: 'lol transformed /root/bar.js lol',
          map: 'sourcemap /root/bar.js',
          sourceCode: 'source /root/bar.js',
          sourcePath: '/root/bar.js'
        });

        var imgModule_DEPRECATED = {
          __packager_asset: true,
          isStatic: true,
          path: '/root/img/img.png',
          uri: 'img',
          width: 25,
          height: 50,
          deprecated: true,
        };

        expect(p.addModule.mock.calls[2][0]).toEqual({
          code: 'lol module.exports = ' +
            JSON.stringify(imgModule_DEPRECATED) +
            '; lol',
          sourceCode: 'module.exports = ' +
            JSON.stringify(imgModule_DEPRECATED) +
            ';',
          sourcePath: '/root/img/img.png'
        });

        var imgModule = {
          __packager_asset: true,
          fileSystemLocation: '/root/img',
          httpServerLocation: '/assets/img',
          width: 25,
          height: 50,
          scales: [1, 2, 3],
          hash: 'i am a hash',
          name: 'img',
          type: 'png',
        };

        expect(p.addModule.mock.calls[3][0]).toEqual({
          code: 'lol module.exports = require("AssetRegistry").registerAsset(' +
            JSON.stringify(imgModule) +
            '); lol',
          sourceCode: 'module.exports = require("AssetRegistry").registerAsset(' +
            JSON.stringify(imgModule) +
            ');',
          sourcePath: '/root/img/new_image.png'
        });

        expect(p.addModule.mock.calls[4][0]).toEqual({
          code: 'lol module.exports = {"json":true}; lol',
          sourceCode: 'module.exports = {"json":true};',
          sourcePath: '/root/file.json'
        });

        expect(p.finalize.mock.calls[0]).toEqual([
          {runMainModule: true}
        ]);

        expect(p.addAsset.mock.calls[0]).toEqual([
          imgModule_DEPRECATED
        ]);

        expect(p.addAsset.mock.calls[1]).toEqual([
          imgModule
        ]);
      });
  });
});
