/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentBuilder.h"

namespace facebook {
namespace react {

ComponentBuilder::ComponentBuilder(
    ComponentDescriptorRegistry::Shared const &componentDescriptorRegistry)
    : componentDescriptorRegistry_(componentDescriptorRegistry){};

ShadowNode::Shared ComponentBuilder::build(
    ElementFragment const &elementFragment) const {
  auto &componentDescriptor =
      componentDescriptorRegistry_->at(elementFragment.componentHandle);

  auto children = ShadowNode::ListOfShared{};
  children.reserve(elementFragment.children.size());
  for (auto const &childFragment : elementFragment.children) {
    children.push_back(build(childFragment));
  }

  auto family = componentDescriptor.createFamily(
      ShadowNodeFamilyFragment{
          elementFragment.tag, elementFragment.surfaceId, nullptr},
      nullptr);

  auto shadowNode = componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          elementFragment.props,
          std::make_shared<ShadowNode::ListOfShared const>(children),
          elementFragment.state},
      family);

  if (elementFragment.referenceCallback) {
    elementFragment.referenceCallback(shadowNode);
  }

  if (elementFragment.finalizeCallback) {
    elementFragment.finalizeCallback(const_cast<ShadowNode &>(*shadowNode));
  }

  return shadowNode;
}

} // namespace react
} // namespace facebook
