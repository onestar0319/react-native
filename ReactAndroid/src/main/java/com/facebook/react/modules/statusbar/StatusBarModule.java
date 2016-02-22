/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 * <p/>
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */


package com.facebook.react.modules.statusbar;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.annotation.TargetApi;
import android.app.Activity;
import android.os.Build;
import android.support.v4.view.ViewCompat;
import android.view.View;
import android.view.WindowManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

public class StatusBarModule extends ReactContextBaseJavaModule {

  private static final String ERROR_NO_ACTIVITY = "E_NO_ACTIVITY";
  private static final String ERROR_NO_ACTIVITY_MESSAGE =
    "Tried to change the status bar while not attached to an Activity";

  public StatusBarModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "StatusBarManager";
  }

  @ReactMethod
  public void setColor(final int color, final boolean animated, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      UiThreadUtil.runOnUiThread(
        new Runnable() {
          @TargetApi(Build.VERSION_CODES.LOLLIPOP)
          @Override
          public void run() {
            if (animated) {
              int curColor = activity.getWindow().getStatusBarColor();
              ValueAnimator colorAnimation = ValueAnimator.ofObject(
                new ArgbEvaluator(), curColor, color);

              colorAnimation.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
                @Override
                public void onAnimationUpdate(ValueAnimator animator) {
                  activity.getWindow().setStatusBarColor((Integer) animator.getAnimatedValue());
                }
              });
              colorAnimation
                .setDuration(300)
                .setStartDelay(0);
              colorAnimation.start();
            } else {
              activity.getWindow().setStatusBarColor(color);
            }
            res.resolve(null);
          }
        }
      );
    } else {
      res.resolve(null);
    }
  }

  @ReactMethod
  public void setTranslucent(final boolean translucent, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }
    UiThreadUtil.runOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          int flags = activity.getWindow().getDecorView().getSystemUiVisibility();
          if (translucent) {
            flags |= View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
          } else {
            flags &= ~(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
          }
          activity.getWindow().getDecorView().setSystemUiVisibility(flags);
          ViewCompat.requestApplyInsets(activity.getWindow().getDecorView());
          res.resolve(null);
        }
      }
    );
  }

  @ReactMethod
  public void setHidden(final boolean hidden, final Promise res) {
    final Activity activity = getCurrentActivity();
    if (activity == null) {
      res.reject(ERROR_NO_ACTIVITY, ERROR_NO_ACTIVITY_MESSAGE);
      return;
    }
    UiThreadUtil.runOnUiThread(
      new Runnable() {
        @Override
        public void run() {
          if (hidden) {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
          } else {
            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
          }

          res.resolve(null);
        }
      }
    );
  }
}
