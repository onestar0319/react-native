/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/Task.h>

namespace facebook::react {

struct TaskWrapper : public jsi::HostObject {
  TaskWrapper(std::shared_ptr<Task> const &task) : task(task) {}

  std::shared_ptr<Task> task;
};

inline static jsi::Value valueFromTask(
    jsi::Runtime &runtime,
    std::shared_ptr<Task> const &task) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<TaskWrapper>(task));
}

} // namespace facebook::react
