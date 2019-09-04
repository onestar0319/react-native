/**
* Copyright (c) Facebook, Inc. and its affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*
* @generated by codegen project: GeneratePropsJavaDelegate.js
*/

package com.facebook.react.viewmanagers;

import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.BaseViewManagerDelegate;
import com.facebook.react.uimanager.BaseViewManagerInterface;
import com.facebook.react.uimanager.LayoutShadowNode;

public class SegmentedControlManagerDelegate<T extends View, U extends BaseViewManagerInterface<T> & SegmentedControlManagerInterface<T>> extends BaseViewManagerDelegate<T, U> {
  public SegmentedControlManagerDelegate(U viewManager) {
    super(viewManager);
  }
  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    switch (propName) {
      case "values":
        mViewManager.setValues(view, (ReadableArray) value);
        break;
      case "selectedIndex":
        mViewManager.setSelectedIndex(view, value == null ? 0 : ((Double) value).intValue());
        break;
      case "enabled":
        mViewManager.setEnabled(view, value == null ? true : (boolean) value);
        break;
      case "tintColor":
        mViewManager.setTintColor(view, value == null ? null : ((Double) value).intValue());
        break;
      case "momentary":
        mViewManager.setMomentary(view, value == null ? false : (boolean) value);
        break;
      default:
        super.setProperty(view, propName, value);
    }
  }
}
