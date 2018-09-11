// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <fabric/core/ReactPrimitives.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/uimanager/ShadowViewMutation.h>

namespace facebook {
namespace react {

/*
 * Abstract class for Scheduler's delegate.
 */
class SchedulerDelegate {

public:
  /*
   * Called right after Scheduler computed (and laid out) a new updated version
   * of the tree and calculated a set of mutations which are suffisient
   * to construct a new one.
   */
  virtual void schedulerDidFinishTransaction(Tag rootTag, const ShadowViewMutationList &mutations) = 0;

  /*
   * Called right after a new ShadowNode was created.
   */
  virtual void schedulerDidRequestPreliminaryViewAllocation(ComponentName componentName) = 0;

  virtual ~SchedulerDelegate() noexcept = default;
};

} // namespace react
} // namespace facebook
