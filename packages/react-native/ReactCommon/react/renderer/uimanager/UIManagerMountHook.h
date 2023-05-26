/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include "UIManager.h"

namespace facebook::react {

class ShadowTree;
class UIManager;

/*
 * Implementing a mount hook allows to observe Shadow Trees being mounted in
 * the host platform.
 */
class UIManagerMountHook {
 public:
  /*
   * Called right after a `ShadowTree` is mounted in the host platform.
   */
  virtual void shadowTreeDidMount(
      RootShadowNode::Shared const &rootShadowNode,
      double mountTime) noexcept = 0;

  virtual ~UIManagerMountHook() noexcept = default;
};

} // namespace facebook::react
