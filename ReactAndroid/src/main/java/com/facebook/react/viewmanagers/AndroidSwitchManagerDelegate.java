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
import com.facebook.react.uimanager.BaseViewManagerDelegate;
import com.facebook.react.uimanager.BaseViewManagerInterface;
import com.facebook.react.uimanager.LayoutShadowNode;

public class AndroidSwitchManagerDelegate<T extends View, U extends BaseViewManagerInterface<T> & AndroidSwitchManagerInterface<T>> extends BaseViewManagerDelegate<T, U> {
  public AndroidSwitchManagerDelegate(U viewManager) {
    super(viewManager);
  }
  @Override
  public void setProperty(T view, String propName, @Nullable Object value) {
    switch (propName) {
      case "disabled":
        mViewManager.setDisabled(view, value == null ? false : (boolean) value);
        break;
      case "enabled":
        mViewManager.setEnabled(view, value == null ? false : (boolean) value);
        break;
      case "thumbColor":
        mViewManager.setThumbColor(view, value == null ? null : ((Double) value).intValue());
        break;
      case "trackColorForFalse":
        mViewManager.setTrackColorForFalse(view, value == null ? null : ((Double) value).intValue());
        break;
      case "trackColorForTrue":
        mViewManager.setTrackColorForTrue(view, value == null ? null : ((Double) value).intValue());
        break;
      case "value":
        mViewManager.setValue(view, value == null ? false : (boolean) value);
        break;
      case "on":
        mViewManager.setOn(view, value == null ? false : (boolean) value);
        break;
      case "thumbTintColor":
        mViewManager.setThumbTintColor(view, value == null ? null : ((Double) value).intValue());
        break;
      case "trackTintColor":
        mViewManager.setTrackTintColor(view, value == null ? null : ((Double) value).intValue());
        break;
      default:
        super.setProperty(view, propName, value);
    }
  }
}
