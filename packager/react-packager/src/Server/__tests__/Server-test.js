'use strict';

jest.setMock('worker-farm', function() { return function() {}; })
    .dontMock('q')
    .dontMock('os')
    .dontMock('path')
    .dontMock('url')
    .setMock('timers', {
      setImmediate: function(fn) {
        return setTimeout(fn, 0);
      }
    })
    .setMock('uglify-js')
    .dontMock('../');

var q = require('q');

describe('processRequest', function() {
  var server;
  var Packager;
  var FileWatcher;

  var options = {
     projectRoots: ['root'],
     blacklistRE: null,
     cacheVersion: null,
     polyfillModuleNames: null
  };

  var makeRequest = function(requestHandler, requrl) {
    var deferred = q.defer();
    requestHandler({
        url: requrl
      },{
        end: function(res) {
          deferred.resolve(res);
        }
      },{
        next: function() {}
      }
    );
    return deferred.promise;
  };

  var invalidatorFunc = jest.genMockFunction();
  var watcherFunc = jest.genMockFunction();
  var requestHandler;

  beforeEach(function() {
    Packager = require('../../Packager');
    FileWatcher = require('../../FileWatcher');

    Packager.prototype.package = function() {
      return q({
        getSource: function() {
          return 'this is the source';
        },
        getSourceMap: function() {
          return 'this is the source map';
        },
      });
    };

    FileWatcher.prototype.on = watcherFunc;

    Packager.prototype.invalidateFile = invalidatorFunc;

    var Server = require('../');
    server = new Server(options);
    requestHandler = server.processRequest.bind(server);
  });

  pit('returns JS bundle source on request of *.bundle',function() {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
    });
  });

  pit('returns JS bundle source on request of *.bundle (compat)',function() {
    return makeRequest(
      requestHandler,
      'mybundle.runModule.bundle'
    ).then(function(response) {
      expect(response).toEqual('this is the source');
    });
  });

  pit('returns sourcemap on request of *.map', function() {
    return makeRequest(
      requestHandler,
      'mybundle.map?runModule=true'
    ).then(function(response) {
      expect(response).toEqual('"this is the source map"');
    });
  });

  pit('watches all files in projectRoot', function() {
    return makeRequest(
      requestHandler,
      'mybundle.bundle?runModule=true'
    ).then(function() {
      expect(watcherFunc.mock.calls[0][0]).toEqual('all');
      expect(watcherFunc.mock.calls[0][1]).not.toBe(null);
    });
  });


  describe('file changes', function() {
    var triggerFileChange;
    beforeEach(function() {
      FileWatcher.prototype.on = function(eventType, callback) {
        if (eventType !== 'all') {
          throw new Error('Can only handle "all" event in watcher.');
        }
        triggerFileChange = callback;
        return this;
      };
    });

    pit('invalides files in package when file is updated', function() {
      return makeRequest(
        requestHandler,
        'mybundle.bundle?runModule=true'
      ).then(function() {
        var onFileChange = watcherFunc.mock.calls[0][1];
        onFileChange('all','path/file.js', options.projectRoots[0]);
        expect(invalidatorFunc.mock.calls[0][0]).toEqual('root/path/file.js');
      });
    });

    pit('rebuilds the packages that contain a file when that file is changed', function() {
      var packageFunc = jest.genMockFunction();
      packageFunc
        .mockReturnValueOnce(
          q({
            getSource: function() {
              return 'this is the first source';
            },
            getSourceMap: function() {},
          })
        )
        .mockReturnValue(
          q({
            getSource: function() {
              return 'this is the rebuilt source';
            },
            getSourceMap: function() {},
          })
        );

      Packager.prototype.package = packageFunc;

      var Server = require('../../Server');
      server = new Server(options);

      requestHandler = server.processRequest.bind(server);


      return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
        .then(function(response) {
          expect(response).toEqual('this is the first source');
          expect(packageFunc.mock.calls.length).toBe(1);
          triggerFileChange('all','path/file.js', options.projectRoots[0]);
          jest.runAllTimers();
        })
        .then(function() {
          expect(packageFunc.mock.calls.length).toBe(2);
          return makeRequest(requestHandler, 'mybundle.bundle?runModule=true')
            .then(function(response) {
              expect(response).toEqual('this is the rebuilt source');
            });
        });
    });
  });
});
