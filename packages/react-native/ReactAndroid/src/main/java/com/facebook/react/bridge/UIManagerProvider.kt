/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.DeprecatedInNewArchitecture

/**
 * {@link UIManagerProvider} is used to create UIManager objects during the initialization of React
 * Native. This was introduced as a temporary interface to enable the new renderer of React Native
 * in isolation of others part of the new architecture of React Native.
 */
@DeprecatedInNewArchitecture
fun interface UIManagerProvider {

  /* Provides a {@link com.facebook.react.bridge.UIManager} for the context received as a parameter. */
  fun createUIManager(context: ReactApplicationContext): UIManager?
}
