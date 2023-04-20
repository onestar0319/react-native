/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridgeless/ReactInstance.h>

namespace facebook {
namespace react {

class BindingsInstaller {
 public:
  virtual ReactInstance::BindingsInstallFunc getBindingsInstallFunc() {
    return nullptr;
  }
};
} // namespace react
} // namespace facebook
