/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RN_CLI_CONFIG = 'rn-cli.config.js';
let cachedConfig = null;

/**
 * Module capable of getting the configuration that should be used for
 * the `rn-cli`. The configuration file is a JS file named `rn-cli.conf.js`.
 * It has to be on any parent directory of the cli.
 */
const Config = {
  get() {
    if (cachedConfig) {
      return cachedConfig;
    }

    const parentDir = findParentDirectory(__dirname, RN_CLI_CONFIG);

    if (!parentDir) {
      throw new Error(
        'Can\'t find "rn-cli.config.js" file in any parent folder of "' +
        __dirname + '"'
      );
    }

    cachedConfig = require(path.join(parentDir, RN_CLI_CONFIG));
    return cachedConfig;
  }
};

// Finds the most near ancestor starting at `currentFullPath` that has
// a file named `filename`
function findParentDirectory(currentFullPath, filename) {
  const root = path.parse(currentFullPath).root;
  const testDir = (parts) => {
    if (parts.length === 0) {
      return null;
    }

    const fullPath = path.join(root, parts.join(path.sep));

    var exists = fs.existsSync(path.join(fullPath, filename));
    return exists ? fullPath : testDir(parts.slice(0, -1));
  };

  return testDir(currentFullPath.substring(1).split(path.sep));
}

module.exports = Config;
