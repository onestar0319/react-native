/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.touch

import android.graphics.Rect

/**
 * This interface should be implemented by all [View] subclasses that want to use the hitSlop prop
 * to extend their touch areas.
 */
interface ReactHitSlopView {
  val hitSlopRect: Rect?
}
