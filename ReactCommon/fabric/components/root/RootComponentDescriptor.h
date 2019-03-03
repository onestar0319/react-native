/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/root/RootShadowNode.h>
#include <react/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using RootComponentDescriptor = ConcreteComponentDescriptor<RootShadowNode>;

} // namespace react
} // namespace facebook
