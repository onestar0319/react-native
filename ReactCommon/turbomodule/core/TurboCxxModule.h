/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <cxxreact/CxxModule.h>

#include "TurboModule.h"

namespace facebook {
namespace react {

/**
 * A helper class to convert the legacy CxxModule instance to a TurboModule instance.
 * This should be used only for migration purpose (to TurboModule), since it's not very performant
 * due to a lot of back-and-forth value conversions between folly::dynamic and jsi::Value.
 */
class JSI_EXPORT TurboCxxModule : public TurboModule {
public:
  TurboCxxModule(std::unique_ptr<facebook::xplat::module::CxxModule> cxxModule, std::shared_ptr<JSCallInvoker> jsInvoker);

  virtual facebook::jsi::Value get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) override;

  jsi::Value invokeMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const jsi::Value *args,
      size_t count);

private:
  std::vector<facebook::xplat::module::CxxModule::Method> cxxMethods_;
  std::unique_ptr<facebook::xplat::module::CxxModule> cxxModule_;
};

} // namespace react
} // namespace facebook
