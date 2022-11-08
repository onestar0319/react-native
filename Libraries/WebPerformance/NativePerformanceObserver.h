/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <vector>
#include "NativePerformanceObserver_RawPerformanceEntry.h"

namespace facebook::react {

class NativePerformanceObserver
    : public NativePerformanceObserverCxxSpec<NativePerformanceObserver>,
      std::enable_shared_from_this<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);

  void startReporting(jsi::Runtime &rt, std::string entryType);

  void stopReporting(jsi::Runtime &rt, std::string entryType);

  std::vector<RawPerformanceEntry> getPendingEntries(jsi::Runtime &rt);

  void setOnPerformanceEntryCallback(
      jsi::Runtime &rt,
      std::optional<AsyncCallback<>> callback);

 private:
  std::optional<AsyncCallback<>> callback_;
};

} // namespace facebook::react
