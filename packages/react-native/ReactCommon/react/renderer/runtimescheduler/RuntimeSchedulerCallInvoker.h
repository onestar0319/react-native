/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace facebook::react {

/*
 * Exposes RuntimeScheduler to native modules. All calls invoked on JavaScript
 * queue from native modules will be funneled through RuntimeScheduler.
 */
class RuntimeSchedulerCallInvoker : public CallInvoker {
 public:
  RuntimeSchedulerCallInvoker(std::weak_ptr<RuntimeScheduler> runtimeScheduler);

  void invokeAsync(CallFunc &&func) override;
  void invokeSync(CallFunc &&func) override;
  void invokeAsync(SchedulerPriority priority, CallFunc &&func) override;

 private:
  /*
   * RuntimeScheduler is retained by the runtime. It must not be
   * retained by anything beyond the runtime.
   */
  std::weak_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace facebook::react
