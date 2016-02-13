/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import com.facebook.react.views.textinput.ReactTextInputManager;

/* package */ class RCTTextInputManager extends ReactTextInputManager {

  @Override
  public RCTTextInput createShadowNodeInstance() {
    return new RCTTextInput();
  }

  @Override
  public Class<RCTTextInput> getShadowNodeClass() {
    return RCTTextInput.class;
  }
}
