/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.csslayout;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum CSSAlign {
  AUTO(0),
  FLEX_START(1),
  CENTER(2),
  FLEX_END(3),
  STRETCH(4);

  private int mIntValue;

  CSSAlign(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static CSSAlign fromInt(int value) {
    switch (value) {
      case 0: return AUTO;
      case 1: return FLEX_START;
      case 2: return CENTER;
      case 3: return FLEX_END;
      case 4: return STRETCH;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
