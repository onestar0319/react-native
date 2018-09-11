/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

/**
 * A JS exception that was propagated to native. In debug mode, these exceptions are normally shown
 * to developers in a redbox.
 */
public class JavascriptException extends RuntimeException {

  public JavascriptException(String jsStackTrace) {
    super(jsStackTrace);
  }
}
