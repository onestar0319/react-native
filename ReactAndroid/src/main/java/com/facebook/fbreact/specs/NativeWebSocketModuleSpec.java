/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 *
 * <p>Generated by an internal genrule from Flow types.
 *
 * @generated
 * @nolint
 */

package com.facebook.fbreact.specs;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactModuleWithSpec;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;

public abstract class NativeWebSocketModuleSpec extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public NativeWebSocketModuleSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @ReactMethod
  public abstract void sendBinary(String base64String, double socketID);

  @ReactMethod
  public abstract void removeListeners(double count);

  @ReactMethod
  public abstract void ping(double socketID);

  @ReactMethod
  public abstract void close(double code, String reason, double socketID);

  @ReactMethod
  public abstract void send(String message, double socketID);

  @ReactMethod
  public abstract void connect(String url, ReadableArray protocols, ReadableMap options,
      double socketID);

  @ReactMethod
  public abstract void addListener(String eventName);
}
