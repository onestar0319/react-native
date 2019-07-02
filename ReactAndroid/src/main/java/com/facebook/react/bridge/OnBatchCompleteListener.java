/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

/** Interface for a module that will be notified when a batch of JS->Java calls has finished. */
public interface OnBatchCompleteListener {

  void onBatchComplete();
}
