/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/core/ComponentDescriptor.h>
#include <react/core/ShadowNode.h>
#include <react/core/ShadowNodeFamilyFragment.h>
#include <react/core/ShadowNodeFragment.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>

#include <react/element/Element.h>
#include <react/element/ElementFragment.h>

namespace facebook {
namespace react {

/*
 * Build `ShadowNode` trees with a given given `Element` trees.
 */
class ComponentBuilder final {
 public:
  ComponentBuilder(
      ComponentDescriptorRegistry::Shared const &componentDescriptorRegistry);

  /*
   * Builds a `ShadowNode` tree with given `Element` tree using stored
   * `ComponentDescriptorRegistry`.
   */
  template <typename ShadowNodeT>
  std::shared_ptr<ShadowNodeT const> build(Element<ShadowNodeT> element) const {
    return std::static_pointer_cast<ShadowNodeT const>(
        build(element.fragment_));
  }

 private:
  /*
   * Internal, type-erased version of `build`.
   */
  ShadowNode::Shared build(ElementFragment const &elementFragment) const;

  ComponentDescriptorRegistry::Shared componentDescriptorRegistry_;
};

} // namespace react
} // namespace facebook
