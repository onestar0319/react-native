/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridgeless.exceptionmanager;

import com.facebook.proguard.annotations.DoNotStripAny;
import com.facebook.react.common.mapbuffer.ReadableMapBuffer;

@DoNotStripAny
public interface ReactJsExceptionHandler {

  void reportJsException(ReadableMapBuffer errorMap);
}
