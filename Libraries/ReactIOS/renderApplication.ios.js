/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 * @flow
 */

'use strict';

var AppContainer = require('AppContainer');
var React = require('React');
var ReactNative = require('ReactNative');

var invariant = require('fbjs/lib/invariant');

function renderApplication<P>(
  RootComponent: ReactClass<P>,
  initialProps: P,
  rootTag: any
) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  ReactNative.render(
    <AppContainer rootTag={rootTag}>
      <RootComponent
        {...initialProps}
        rootTag={rootTag}
      />
    </AppContainer>,
    rootTag
  );
}


module.exports = renderApplication;
