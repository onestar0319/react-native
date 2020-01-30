/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LayoutableShadowNode.h"

#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/core/LayoutMetrics.h>
#include <react/core/ShadowNode.h>
#include <react/debug/DebugStringConvertibleItem.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

/*
 * `shadowNode` might not be the newest revision of `ShadowNodeFamily`.
 * This function looks at `parentNode`'s children and finds one that belongs
 * to the same family as `shadowNode`.
 */
static ShadowNode const *findNewestChildInParent(
    ShadowNode const &parentNode,
    ShadowNode const &shadowNode) {
  for (auto const &child : parentNode.getChildren()) {
    if (ShadowNode::sameFamily(*child, shadowNode)) {
      return child.get();
    }
  }
  return nullptr;
}

static LayoutMetrics calculateOffsetForLayoutMetrics(
    LayoutMetrics layoutMetrics,
    ShadowNode::AncestorList const &ancestors,
    LayoutableShadowNode::LayoutInspectingPolicy const &policy) {
  // `AncestorList` starts from the given ancestor node and ends with the parent
  // node. We iterate from parent node (reverse iteration) and stop before the
  // given ancestor (rend() - 1).
  for (auto it = ancestors.rbegin(); it != ancestors.rend() - 1; ++it) {
    auto &currentShadowNode = it->first.get();

    if (currentShadowNode.getTraits().check(
            ShadowNodeTraits::Trait::RootNodeKind)) {
      break;
    }

    auto layoutableCurrentShadowNode =
        dynamic_cast<LayoutableShadowNode const *>(&currentShadowNode);

    if (!layoutableCurrentShadowNode) {
      return EmptyLayoutMetrics;
    }

    auto origin = layoutableCurrentShadowNode->getLayoutMetrics().frame.origin;

    if (policy.includeTransform || policy.includeScrollViewContentOffset) {
      // The check for ScrollView will be implemented after we have
      // a dedicated trait (part of `ShadowNodeTraits`) for that.
      origin = origin * layoutableCurrentShadowNode->getTransform();
    }

    layoutMetrics.frame.origin += origin;
  }
  return layoutMetrics;
}

LayoutMetrics LayoutableShadowNode::getLayoutMetrics() const {
  return layoutMetrics_;
}

bool LayoutableShadowNode::setLayoutMetrics(LayoutMetrics layoutMetrics) {
  ensureUnsealed();

  if (layoutMetrics_ == layoutMetrics) {
    return false;
  }

  layoutMetrics_ = layoutMetrics;
  return true;
}

bool LayoutableShadowNode::LayoutableShadowNode::isLayoutOnly() const {
  return false;
}

Transform LayoutableShadowNode::getTransform() const {
  return Transform::Identity();
}

LayoutMetrics LayoutableShadowNode::getRelativeLayoutMetrics(
    LayoutableShadowNode const &ancestorLayoutableShadowNode,
    LayoutInspectingPolicy policy) const {
  auto &ancestorShadowNode =
      dynamic_cast<ShadowNode const &>(ancestorLayoutableShadowNode);
  auto &shadowNode = dynamic_cast<ShadowNode const &>(*this);

  if (ShadowNode::sameFamily(shadowNode, ancestorShadowNode)) {
    auto layoutMetrics = getLayoutMetrics();
    layoutMetrics.frame.origin = {0, 0};
    return layoutMetrics;
  }

  auto ancestors = shadowNode.getFamily().getAncestors(ancestorShadowNode);

  if (ancestors.size() == 0) {
    return EmptyLayoutMetrics;
  }

  auto newestChild =
      findNewestChildInParent(ancestors.rbegin()->first.get(), shadowNode);

  if (!newestChild) {
    return EmptyLayoutMetrics;
  }

  auto layoutMetrics = dynamic_cast<LayoutableShadowNode const *>(newestChild)
                           ->getLayoutMetrics();

  return calculateOffsetForLayoutMetrics(layoutMetrics, ancestors, policy);
}

Size LayoutableShadowNode::measure(LayoutConstraints layoutConstraints) const {
  return Size();
}

Float LayoutableShadowNode::firstBaseline(Size size) const {
  return 0;
}

Float LayoutableShadowNode::lastBaseline(Size size) const {
  return 0;
}

void LayoutableShadowNode::layout(LayoutContext layoutContext) {
  layoutChildren(layoutContext);

  for (auto child : getLayoutableChildNodes()) {
    if (!child->getHasNewLayout()) {
      continue;
    }

    child->ensureUnsealed();
    child->setHasNewLayout(false);

    auto childLayoutMetrics = child->getLayoutMetrics();
    if (childLayoutMetrics.displayType == DisplayType::None) {
      continue;
    }

    auto childLayoutContext = LayoutContext(layoutContext);
    childLayoutContext.absolutePosition += childLayoutMetrics.frame.origin;

    child->layout(layoutContext);
  }
}

ShadowNode::Shared LayoutableShadowNode::findNodeAtPoint(
    ShadowNode::Shared node,
    Point point) {
  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(node.get());

  if (!layoutableShadowNode) {
    return nullptr;
  }
  auto frame = layoutableShadowNode->getLayoutMetrics().frame;
  auto isPointInside = frame.containsPoint(point);

  if (!isPointInside) {
    return nullptr;
  }

  auto newPoint = point - frame.origin;
  for (const auto &childShadowNode : node->getChildren()) {
    auto hitView = findNodeAtPoint(childShadowNode, newPoint);
    if (hitView) {
      return hitView;
    }
  }
  return isPointInside ? node : nullptr;
}

void LayoutableShadowNode::layoutChildren(LayoutContext layoutContext) {
  // Default implementation does nothing.
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList LayoutableShadowNode::getDebugProps() const {
  auto list = SharedDebugStringConvertibleList{};

  if (getHasNewLayout()) {
    list.push_back(
        std::make_shared<DebugStringConvertibleItem>("hasNewLayout"));
  }

  if (!getIsLayoutClean()) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("dirty"));
  }

  auto layoutMetrics = getLayoutMetrics();
  auto defaultLayoutMetrics = LayoutMetrics();

  list.push_back(std::make_shared<DebugStringConvertibleItem>(
      "frame", toString(layoutMetrics.frame)));

  if (layoutMetrics.borderWidth != defaultLayoutMetrics.borderWidth) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "borderWidth", toString(layoutMetrics.borderWidth)));
  }

  if (layoutMetrics.contentInsets != defaultLayoutMetrics.contentInsets) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>(
        "contentInsets", toString(layoutMetrics.contentInsets)));
  }

  if (layoutMetrics.displayType == DisplayType::None) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("hidden"));
  }

  if (layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    list.push_back(std::make_shared<DebugStringConvertibleItem>("rtl"));
  }

  return list;
}
#endif

} // namespace react
} // namespace facebook
