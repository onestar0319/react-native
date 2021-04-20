/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeScheduler.h"

namespace facebook::react {

Task::Task(
    SchedulerPriority priority,
    jsi::Function callback,
    std::chrono::steady_clock::time_point expirationTime)
    : priority(priority),
      callback(std::move(callback)),
      expirationTime(expirationTime) {}

jsi::Value Task::execute(jsi::Runtime &runtime) const {
  // Cancelled task doesn't have a callback.
  if (callback) {
    // Callback in JavaScript is expecting a single bool parameter.
    // React team plans to remove it and it is safe to pass in
    // hardcoded false value.
    return callback.value().call(runtime, {false});
  }
  return jsi::Value::undefined();
}

} // namespace facebook::react
