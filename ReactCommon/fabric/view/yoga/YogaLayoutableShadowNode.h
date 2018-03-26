/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <yoga/YGNode.h>

#include <fabric/core/LayoutableShadowNode.h>
#include <fabric/core/Sealable.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/view/YogaStylableProps.h>

namespace facebook {
namespace react {

class YogaLayoutableShadowNode;

// We accept that Yoga node is highly mutable thing and we don't try to enforce immutability,
// so it does not have `const` qualifier (and we mark it as `mutable` in the class).
using SharedYogaNode = std::shared_ptr<YGNode>;
using SharedYogaConfig = std::shared_ptr<YGConfig>;

using SharedYogaLayoutableShadowNode = std::shared_ptr<const YogaLayoutableShadowNode>;
using SharedYogaLayoutableShadowNodeList = std::vector<const SharedYogaLayoutableShadowNode>;
using SharedYogaLayoutableShadowNodeSharedList = std::shared_ptr<const SharedYogaLayoutableShadowNodeList>;

class YogaLayoutableShadowNode:
  public LayoutableShadowNode,
  public virtual DebugStringConvertible,
  public virtual Sealable {

public:

#pragma mark - Constructors

  YogaLayoutableShadowNode(
    const SharedYogaStylableProps &props,
    const SharedShadowNodeSharedList &children
  );

  YogaLayoutableShadowNode(
    const SharedYogaLayoutableShadowNode &shadowNode,
    const SharedYogaStylableProps &props = nullptr,
    const SharedShadowNodeSharedList &children = nullptr
  );

#pragma mark - Mutating Methods

  /*
   * Appends `child`'s Yoga node to the own Yoga node.
   * So, it complements `ShadowNode::appendChild(...)` functionality from Yoga
   * perspective.
   */
  void appendChild(SharedYogaLayoutableShadowNode child);

  void cleanLayout() override;
  void dirtyLayout() override;
  bool getIsLayoutClean() const override;

  void setHasNewLayout(bool hasNewLayout) override;
  bool getHasNewLayout() const override;

  /*
   * Computes layout using Yoga layout engine.
   * See `LayoutableShadowNode` for more details.
   */
  void layout(LayoutContext layoutContext) override;
  
  void layoutChildren(LayoutContext layoutContext) override;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

private:
  mutable SharedYogaNode yogaNode_;

  static SharedYogaConfig suitableYogaConfig();
  static void setYogaNodeChildrenBasedOnShadowNodeChildren(YGNode &yogaNode, const SharedShadowNodeSharedList &children);
  static void yogaNodeCloneCallbackConnector(YGNode *oldYogaNode, YGNode *newYogaNode, YGNode *parentYogaNode, int childIndex);
};

} // namespace react
} // namespace facebook
