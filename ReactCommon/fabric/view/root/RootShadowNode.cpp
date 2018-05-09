/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootShadowNode.h"

namespace facebook {
namespace react {

ComponentName RootShadowNode::getComponentName() const {
  return ComponentName("RootView");
}

void RootShadowNode::layout() {
  ensureUnsealed();
  layout(getProps()->getLayoutContext());
}

} // namespace react
} // namespace facebook
