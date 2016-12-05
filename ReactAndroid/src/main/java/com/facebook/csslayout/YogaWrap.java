/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.yoga;

import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public enum YogaWrap {
  NO_WRAP(0),
  WRAP(1);

  private int mIntValue;

  YogaWrap(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaWrap fromInt(int value) {
    switch (value) {
      case 0: return NO_WRAP;
      case 1: return WRAP;
      default: throw new IllegalArgumentException("Unkown enum value: " + value);
    }
  }
}
