/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * This script runs instrumentation tests one by one with retries
 * Instrumentation tests tend to be flaky, so rerunning them individually increases
 * chances for success and reduces total average execution time.
 *
 * We assume that all instrumentation tests are flat in one folder
 * Available arguments:
 * --path - path to all .java files with tests
 * --package - com.facebook.react.tests
 * --retries [num] - how many times to retry possible flaky commands: npm install and running tests, default 1
 */
/*eslint-disable no-undef */
require('shelljs/global');

const argv = require('yargs').argv;
const numberOfRetries = argv.retries || 1;
const tryExecNTimes = require('./try-n-times');
const path = require('path');

// ReactAndroid/src/androidTest/java/com/facebook/react/tests/ReactHorizontalScrollViewTestCase.java
const testClasses = ls(`${argv.path}/*.java`)
.map(javaFile => {
  // ReactHorizontalScrollViewTestCase
  return path.basename(javaFile, '.java');
}).map(className => {
  // com.facebook.react.tests.ReactHorizontalScrollViewTestCase
  return argv.package + '.' + className;
});

let exitCode = 0;
testClasses.forEach((testClass) => {
  if (tryExecNTimes(
    () => {
      echo(`Starting ${testClass}`);
      // any faster means Circle CI crashes
      exec('sleep 10s');
      return exec(`./scripts/run-instrumentation-tests-via-adb-shell.sh ${argv.package} ${testClass}`).code;
    },
    numberOfRetries)) {
      echo(`${testClass} failed ${numberOfRetries} times`);
      exitCode = 1;
  }
});

exit(exitCode);

/*eslint-enable no-undef */
