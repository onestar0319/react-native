/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const attachHMRServer = require('./util/attachHMRServer');
const connect = require('connect');
const cpuProfilerMiddleware = require('./middleware/cpuProfilerMiddleware');
const getDevToolsMiddleware = require('./middleware/getDevToolsMiddleware');
const http = require('http');
const loadRawBodyMiddleware = require('./middleware/loadRawBodyMiddleware');
const messageSocket = require('./util/messageSocket.js');
const openStackFrameInEditorMiddleware = require('./middleware/openStackFrameInEditorMiddleware');
const copyToClipBoardMiddleware = require('./middleware/copyToClipBoardMiddleware');
const path = require('path');
const ReactPackager = require('../../packager/react-packager');
const statusPageMiddleware = require('./middleware/statusPageMiddleware.js');
const indexPageMiddleware = require('./middleware/indexPage');
const systraceProfileMiddleware = require('./middleware/systraceProfileMiddleware.js');
const heapCaptureMiddleware = require('./middleware/heapCaptureMiddleware.js');
const webSocketProxy = require('./util/webSocketProxy.js');
const defaultAssetExts = require('../../packager/defaultAssetExts');

function runServer(args, config, readyCallback) {
  var wsProxy = null;
  var ms = null;
  const packagerServer = getPackagerServer(args, config);
  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(connect.compress())
    .use(getDevToolsMiddleware(args, () => wsProxy && wsProxy.isChromeConnected()))
    .use(getDevToolsMiddleware(args, () => ms && ms.isChromeConnected()))
    .use(openStackFrameInEditorMiddleware(args))
    .use(copyToClipBoardMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(heapCaptureMiddleware)
    .use(cpuProfilerMiddleware)
    .use(indexPageMiddleware)
    .use(packagerServer.processRequest.bind(packagerServer));

  args.projectRoots.forEach(root => app.use(connect.static(root)));

  app.use(connect.logger())
    .use(connect.errorHandler());

  const serverInstance = http.createServer(app).listen(
    args.port,
    args.host,
    function() {
      attachHMRServer({
        httpServer: serverInstance,
        path: '/hot',
        packagerServer,
      });

      wsProxy = webSocketProxy.attachToServer(serverInstance, '/debugger-proxy');
      ms = messageSocket.attachToServer(serverInstance, '/message');
      webSocketProxy.attachToServer(serverInstance, '/devtools');
      readyCallback();
    }
  );
  // Disable any kind of automatic timeout behavior for incoming
  // requests in case it takes the packager more than the default
  // timeout of 120 seconds to respond to a request.
  serverInstance.timeout = 0;
}

function getPackagerServer(args, config) {
  const transformModulePath =
    args.transformer ? path.resolve(args.transformer) :
    typeof config.getTransformModulePath === 'function' ? config.getTransformModulePath() :
    undefined;

  return ReactPackager.createServer({
    nonPersistent: args.nonPersistent,
    projectRoots: args.projectRoots,
    blacklistRE: config.getBlacklistRE(),
    cacheVersion: '3',
    getTransformOptionsModulePath: config.getTransformOptionsModulePath,
    transformModulePath: transformModulePath,
    extraNodeModules: config.extraNodeModules,
    assetRoots: args.assetRoots,
    assetExts: defaultAssetExts.concat(args.assetExts),
    resetCache: args.resetCache,
    verbose: args.verbose,
  });
}

module.exports = runServer;
