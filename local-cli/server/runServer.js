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
const isAbsolutePath = require('absolute-path');
const loadRawBodyMiddleware = require('./middleware/loadRawBodyMiddleware');
const openStackFrameInEditorMiddleware = require('./middleware/openStackFrameInEditorMiddleware');
const path = require('path');
const ReactPackager = require('../../packager/react-packager');
const statusPageMiddleware = require('./middleware/statusPageMiddleware.js');
const systraceProfileMiddleware = require('./middleware/systraceProfileMiddleware.js');
const webSocketProxy = require('./util/webSocketProxy.js');

function runServer(args, config, readyCallback) {
  var wsProxy = null;
  const packagerServer = getPackagerServer(args, config);
  const app = connect()
    .use(loadRawBodyMiddleware)
    .use(connect.compress())
    .use(getDevToolsMiddleware(args, () => wsProxy && wsProxy.isChromeConnected()))
    .use(openStackFrameInEditorMiddleware)
    .use(statusPageMiddleware)
    .use(systraceProfileMiddleware)
    .use(cpuProfilerMiddleware)
    // Temporarily disable flow check until it's more stable
    //.use(getFlowTypeCheckMiddleware(args))
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
  let transformerPath = args.transformer;
  if (!isAbsolutePath(transformerPath)) {
    transformerPath = path.resolve(process.cwd(), transformerPath);
  }

  return ReactPackager.createServer({
    nonPersistent: args.nonPersistent,
    projectRoots: args.projectRoots,
    blacklistRE: config.getBlacklistRE(),
    cacheVersion: '3',
    getTransformOptionsModulePath: config.getTransformOptionsModulePath,
    transformModulePath: transformerPath,
    assetRoots: args.assetRoots,
    assetExts: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'],
    resetCache: args.resetCache || args['reset-cache'],
    polyfillModuleNames: [
      require.resolve(
        '../../Libraries/JavaScriptAppEngine/polyfills/document.js'
      ),
    ],
    verbose: args.verbose,
  });
}

module.exports = runServer;
