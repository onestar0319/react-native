/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @generated by enums.py

package com.facebook.yoga;

public enum YogaErrata {
  NONE(0),
  STRETCH_FLEX_BASIS(1),
  ALL(2147483647),
  CLASSIC(2147483646);

  private final int mIntValue;

  YogaErrata(int intValue) {
    mIntValue = intValue;
  }

  public int intValue() {
    return mIntValue;
  }

  public static YogaErrata fromInt(int value) {
    switch (value) {
      case 0: return NONE;
      case 1: return STRETCH_FLEX_BASIS;
      case 2147483647: return ALL;
      case 2147483646: return CLASSIC;
      default: throw new IllegalArgumentException("Unknown enum value: " + value);
    }
  }
}
