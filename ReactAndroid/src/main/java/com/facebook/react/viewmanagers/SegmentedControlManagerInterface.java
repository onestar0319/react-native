/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* @generated by codegen project: GeneratePropsJavaInterface.js
*/

package com.facebook.react.viewmanagers;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;

public interface SegmentedControlManagerInterface<T extends View> {
  void setValues(T view, @Nullable ReadableArray value);
  void setSelectedIndex(T view, int value);
  void setEnabled(T view, boolean value);
  void setTintColor(T view, @Nullable Integer value);
  void setTextColor(T view, @Nullable Integer value);
  void setBackgroundColor(T view, @Nullable Integer value);
  void setMomentary(T view, boolean value);
}
