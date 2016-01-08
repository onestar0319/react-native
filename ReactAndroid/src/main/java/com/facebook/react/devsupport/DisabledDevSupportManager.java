/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.modules.debug.DeveloperSettings;

/**
 * A dummy implementation of {@link DevSupportManager} to be used in production mode where
 * development features aren't needed.
 */
public class DisabledDevSupportManager implements DevSupportManager {

  @Override
  public void showNewJavaError(String message, Throwable e) {

  }

  @Override
  public void addCustomDevOption(String optionName, DevOptionHandler optionHandler) {

  }

  @Override
  public void showNewJSError(String message, ReadableArray details, int errorCookie) {

  }

  @Override
  public void updateJSError(String message, ReadableArray details, int errorCookie) {

  }

  @Override
  public void showDevOptionsDialog() {

  }

  @Override
  public void setDevSupportEnabled(boolean isDevSupportEnabled) {

  }

  @Override
  public boolean getDevSupportEnabled() {
    return false;
  }

  @Override
  public DeveloperSettings getDevSettings() {
    return null;
  }

  @Override
  public void onNewReactContextCreated(ReactContext reactContext) {

  }

  @Override
  public void onReactInstanceDestroyed(ReactContext reactContext) {

  }

  @Override
  public String getSourceMapUrl() {
    return null;
  }

  @Override
  public String getSourceUrl() {
    return null;
  }

  @Override
  public String getJSBundleURLForRemoteDebugging() {
    return null;
  }

  @Override
  public String getDownloadedJSBundleFile() {
    return null;
  }

  @Override
  public boolean hasUpToDateJSBundleInCache() {
    return false;
  }

  @Override
  public void reloadSettings() {

  }

  @Override
  public void handleReloadJS() {

  }

  @Override
  public void isPackagerRunning(DevServerHelper.PackagerStatusCallback callback) {

  }

  @Override
  public void handleException(Exception e) {

  }
}
