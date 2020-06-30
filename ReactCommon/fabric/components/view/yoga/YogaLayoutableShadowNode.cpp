/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaLayoutableShadowNode.h"
#include <react/components/view/ViewProps.h>
#include <react/components/view/conversions.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/debug/DebugStringConvertibleItem.h>
#include <react/debug/SystraceSection.h>
#include <react/utils/ThreadStorage.h>
#include <yoga/Yoga.h>
#include <algorithm>
#include <limits>
#include <memory>

namespace facebook {
namespace react {

static void applyLayoutConstraints(
    YGStyle &yogaStyle,
    LayoutConstraints const &layoutConstraints) {
  yogaStyle.minDimensions()[YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.width);
  yogaStyle.minDimensions()[YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.minimumSize.height);

  yogaStyle.maxDimensions()[YGDimensionWidth] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.width);
  yogaStyle.maxDimensions()[YGDimensionHeight] =
      yogaStyleValueFromFloat(layoutConstraints.maximumSize.height);

  yogaStyle.direction() =
      yogaDirectionFromLayoutDirection(layoutConstraints.layoutDirection);
}

ShadowNodeTraits YogaLayoutableShadowNode::BaseTraits() {
  auto traits = LayoutableShadowNode::BaseTraits();
  traits.set(ShadowNodeTraits::Trait::YogaLayoutableKind);
  return traits;
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNodeFragment const &fragment,
    ShadowNodeFamily::Shared const &family,
    ShadowNodeTraits traits)
    : LayoutableShadowNode(fragment, family, traits),
      yogaConfig_(nullptr),
      yogaNode_(&initializeYogaConfig(yogaConfig_)) {
  yogaNode_.setContext(this);

  // Newly created node must be `dirty` just becasue it is new.
  // This is not a default for `YGNode`.
  yogaNode_.setDirty(true);

  updateYogaProps();
  updateYogaChildren();

  ensureConsistency();
}

YogaLayoutableShadowNode::YogaLayoutableShadowNode(
    ShadowNode const &sourceShadowNode,
    ShadowNodeFragment const &fragment)
    : LayoutableShadowNode(sourceShadowNode, fragment),
      yogaConfig_(nullptr),
      yogaNode_(
          static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
              .yogaNode_,
          &initializeYogaConfig(yogaConfig_)) {
  yogaNode_.setContext(this);
  yogaNode_.setOwner(nullptr);
  updateYogaChildrenOwnersIfNeeded();

  // Yoga node must inherit dirty flag.
  assert(
      static_cast<YogaLayoutableShadowNode const &>(sourceShadowNode)
          .yogaNode_.isDirty() == yogaNode_.isDirty());

  if (fragment.props) {
    updateYogaProps();
  }

  if (fragment.children) {
    updateYogaChildren();
  }

  ensureConsistency();
}

void YogaLayoutableShadowNode::cleanLayout() {
  yogaNode_.setDirty(false);
}

void YogaLayoutableShadowNode::dirtyLayout() {
  yogaNode_.setDirty(true);
}

bool YogaLayoutableShadowNode::getIsLayoutClean() const {
  return !yogaNode_.isDirty();
}

#pragma mark - Mutating Methods

void YogaLayoutableShadowNode::enableMeasurement() {
  ensureUnsealed();

  yogaNode_.setMeasureFunc(
      YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector);
}

void YogaLayoutableShadowNode::appendYogaChild(ShadowNode const &childNode) {
  // The caller must check this before calling this method.
  assert(!getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  ensureYogaChildrenLookFine();

  auto &layoutableChildNode =
      traitCast<YogaLayoutableShadowNode const &>(childNode);
  yogaNode_.insertChild(
      &layoutableChildNode.yogaNode_, yogaNode_.getChildren().size());

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::adoptYogaChild(size_t index) {
  ensureUnsealed();
  ensureYogaChildrenLookFine();

  // The caller must check this before calling this method.
  assert(!getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode));

  auto &children = getChildren();

  // Overflow checks.
  assert(children.size() > index);
  assert(children.size() >= yogaNode_.getChildren().size());

  auto &childNode = *children.at(index);

  auto &layoutableChildNode =
      traitCast<YogaLayoutableShadowNode const &>(childNode);

  // Note, the following (commented out) assert is conceptually valid but still
  // might produce false-positive signals because of the ABA problem (different
  // objects with non-interleaving life-times being allocated on the same
  // address). assert(layoutableChildNode.yogaNode_.getOwner() != &yogaNode_);

  if (layoutableChildNode.yogaNode_.getOwner() == nullptr) {
    // The child node is not owned.
    layoutableChildNode.yogaNode_.setOwner(&yogaNode_);
    // At this point the child yoga node must be already inserted by the caller.
    // assert(layoutableChildNode.yogaNode_.isDirty());
  } else {
    // The child is owned by some other node, we need to clone that.
    auto clonedChildNode = childNode.clone({});
    auto &layoutableClonedChildNode =
        traitCast<YogaLayoutableShadowNode const &>(*clonedChildNode);

    // The owner must be nullptr for a newly cloned node.
    assert(layoutableClonedChildNode.yogaNode_.getOwner() == nullptr);

    // Establishing ownership.
    layoutableClonedChildNode.yogaNode_.setOwner(&yogaNode_);

    // Replace the child node with a newly cloned one in the children list.
    replaceChild(childNode, clonedChildNode, index);

    // Replace the Yoga node inside the Yoga node children list.
    yogaNode_.replaceChild(&layoutableClonedChildNode.yogaNode_, index);
  }

  ensureYogaChildrenLookFine();
}

void YogaLayoutableShadowNode::appendChild(
    ShadowNode::Shared const &childNode) {
  ensureUnsealed();
  ensureConsistency();

  // Calling the base class (`ShadowNode`) mehtod.
  LayoutableShadowNode::appendChild(childNode);

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    // This node is a declared leaf.
    return;
  }

  // Here we don't have information about the previous structure of the node (if
  // it that existed before), so we don't have anything to compare the Yoga node
  // with (like a previous version of this node). Therefore we must dirty the
  // node.
  yogaNode_.setDirty(true);

  // All children of a non-leaf `YogaLayoutableShadowNode` must be a
  // `YogaLayoutableShadowNode`s.
  assert(traitCast<YogaLayoutableShadowNode const *>(childNode.get()));

  // Appending the Yoga node.
  appendYogaChild(*childNode);

  ensureYogaChildrenLookFine();
  ensureYogaChildrenAlighment();

  // Adopting the Yoga node.
  adoptYogaChild(getChildren().size() - 1);

  ensureConsistency();
}

bool YogaLayoutableShadowNode::doesOwn(
    YogaLayoutableShadowNode const &child) const {
  return child.yogaNode_.getOwner() == &yogaNode_;
}

void YogaLayoutableShadowNode::updateYogaChildrenOwnersIfNeeded() {
  for (auto &childYogaNode : yogaNode_.getChildren()) {
    if (childYogaNode->getOwner() == &yogaNode_) {
      childYogaNode->setOwner(reinterpret_cast<YGNodeRef>(0xBADC0FFEE0DDF00D));
    }
  }
}

void YogaLayoutableShadowNode::updateYogaChildren() {
  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    return;
  }

  ensureUnsealed();

  bool isClean = !yogaNode_.isDirty() &&
      getChildren().size() == yogaNode_.getChildren().size();

  auto oldYogaChildren = isClean ? yogaNode_.getChildren() : YGVector{};
  yogaNode_.setChildren({});

  for (size_t i = 0; i < getChildren().size(); i++) {
    appendYogaChild(*getChildren().at(i));
    adoptYogaChild(i);

    if (isClean) {
      auto &oldYogaChildNode = *oldYogaChildren[i];
      auto &newYogaChildNode =
          traitCast<YogaLayoutableShadowNode const &>(*getChildren().at(i))
              .yogaNode_;

      isClean = isClean && !newYogaChildNode.isDirty() &&
          (newYogaChildNode.getStyle() == oldYogaChildNode.getStyle());
    }
  }

  assert(getChildren().size() == yogaNode_.getChildren().size());

  yogaNode_.setDirty(!isClean);
}

void YogaLayoutableShadowNode::updateYogaProps() {
  ensureUnsealed();

  auto props = static_cast<YogaStylableProps const &>(*props_);

  // Resetting `dirty` flag only if `yogaStyle` portion of `Props` was changed.
  if (!yogaNode_.isDirty() && (props.yogaStyle != yogaNode_.getStyle())) {
    yogaNode_.setDirty(true);
  }

  yogaNode_.setStyle(props.yogaStyle);
}

void YogaLayoutableShadowNode::setSize(Size size) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.dimensions()[YGDimensionWidth] = yogaStyleValueFromFloat(size.width);
  style.dimensions()[YGDimensionHeight] = yogaStyleValueFromFloat(size.height);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPadding(RectangleEdges<Float> padding) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.padding()[YGEdgeTop] = yogaStyleValueFromFloat(padding.top);
  style.padding()[YGEdgeLeft] = yogaStyleValueFromFloat(padding.left);
  style.padding()[YGEdgeRight] = yogaStyleValueFromFloat(padding.right);
  style.padding()[YGEdgeBottom] = yogaStyleValueFromFloat(padding.bottom);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::setPositionType(
    YGPositionType positionType) const {
  ensureUnsealed();

  auto style = yogaNode_.getStyle();
  style.positionType() = positionType;
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(true);
}

void YogaLayoutableShadowNode::layoutTree(
    LayoutContext layoutContext,
    LayoutConstraints layoutConstraints) {
  ensureUnsealed();

  /*
   * In Yoga, every single Yoga Node has to have a (non-null) pointer to
   * Yoga Config (this config can be shared between many nodes),
   * so every node can be individually configured. This does *not* mean
   * however that Yoga consults with every single Yoga Node Config for every
   * config parameter. Especially in case of `pointScaleFactor`,
   * the only value in the config of the root node is taken into account
   * (and this is by design).
   */
  yogaConfig_.pointScaleFactor = layoutContext.pointScaleFactor;

  applyLayoutConstraints(yogaNode_.getStyle(), layoutConstraints);

  ThreadStorage<LayoutContext>::getInstance().set(layoutContext);

  if (layoutContext.swapLeftAndRightInRTL) {
    swapLeftAndRightInTree(*this);
  }

  {
    SystraceSection s("YogaLayoutableShadowNode::YGNodeCalculateLayout");

    YGNodeCalculateLayout(
        &yogaNode_, YGUndefined, YGUndefined, YGDirectionInherit);
  }

  if (yogaNode_.getHasNewLayout()) {
    auto layoutMetrics = layoutMetricsFromYogaNode(yogaNode_);
    layoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    setLayoutMetrics(layoutMetrics);
    yogaNode_.setHasNewLayout(false);
  }

  layout(layoutContext);
}

static EdgeInsets calculateOverflowInset(
    Rect containerFrame,
    Rect contentFrame) {
  auto size = containerFrame.size;
  auto overflowInset = EdgeInsets{};
  overflowInset.left = std::min(contentFrame.getMinX(), Float{0.0});
  overflowInset.top = std::min(contentFrame.getMinY(), Float{0.0});
  overflowInset.right =
      -std::max(contentFrame.getMaxX() - size.width, Float{0.0});
  overflowInset.bottom =
      -std::max(contentFrame.getMaxY() - size.height, Float{0.0});
  return overflowInset;
}

void YogaLayoutableShadowNode::layout(LayoutContext layoutContext) {
  // Reading data from a dirtied node does not make sense.
  assert(!yogaNode_.isDirty());

  auto contentFrame = Rect{};

  for (auto childYogaNode : yogaNode_.getChildren()) {
    auto &childNode =
        *static_cast<YogaLayoutableShadowNode *>(childYogaNode->getContext());

    // Verifying that the Yoga node belongs to the ShadowNode.
    assert(&childNode.yogaNode_ == childYogaNode);

    if (childYogaNode->getHasNewLayout()) {
      childYogaNode->setHasNewLayout(false);

      // Reading data from a dirtied node does not make sense.
      assert(!childYogaNode->isDirty());

      // We must copy layout metrics from Yoga node only once (when the parent
      // node exclusively ownes the child node).
      assert(childYogaNode->getOwner() == &yogaNode_);

      // We are about to mutate layout metrics of the node.
      childNode.ensureUnsealed();

      auto newLayoutMetrics = layoutMetricsFromYogaNode(*childYogaNode);
      newLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;

      // Adding the node to `affectedNodes` if the node's `frame` was changed.
      if (layoutContext.affectedNodes &&
          newLayoutMetrics.frame != childNode.getLayoutMetrics().frame) {
        layoutContext.affectedNodes->push_back(&childNode);
      }

      childNode.setLayoutMetrics(newLayoutMetrics);

      if (newLayoutMetrics.displayType != DisplayType::None) {
        childNode.layout(layoutContext);
      }
    }

    auto layoutMetricsWithOverflowInset = childNode.getLayoutMetrics();
    if (layoutMetricsWithOverflowInset.displayType != DisplayType::None) {
      contentFrame.unionInPlace(insetBy(
          layoutMetricsWithOverflowInset.frame,
          layoutMetricsWithOverflowInset.overflowInset));
    }
  }

  if (yogaNode_.getStyle().overflow() == YGOverflowVisible) {
    layoutMetrics_.overflowInset =
        calculateOverflowInset(layoutMetrics_.frame, contentFrame);
  } else {
    layoutMetrics_.overflowInset = {};
  }
}

#pragma mark - Yoga Connectors

YGNode *YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector(
    YGNode *oldYogaNode,
    YGNode *parentYogaNode,
    int childIndex) {
  SystraceSection s("YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector");

  // At this point it is guaranteed that all shadow nodes associated with yoga
  // nodes are `YogaLayoutableShadowNode` subclasses.
  auto parentNode =
      static_cast<YogaLayoutableShadowNode *>(parentYogaNode->getContext());
  auto oldNode =
      static_cast<YogaLayoutableShadowNode *>(oldYogaNode->getContext());

  auto clonedNode = oldNode->clone({});
  parentNode->replaceChild(*oldNode, clonedNode, childIndex);
  return &static_cast<YogaLayoutableShadowNode &>(*clonedNode).yogaNode_;
}

YGSize YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector(
    YGNode *yogaNode,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  SystraceSection s(
      "YogaLayoutableShadowNode::yogaNodeMeasureCallbackConnector");

  auto shadowNodeRawPtr =
      static_cast<YogaLayoutableShadowNode *>(yogaNode->getContext());

  auto minimumSize = Size{0, 0};
  auto maximumSize = Size{std::numeric_limits<Float>::infinity(),
                          std::numeric_limits<Float>::infinity()};

  switch (widthMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.width = floatFromYogaFloat(width);
      maximumSize.width = floatFromYogaFloat(width);
      break;
    case YGMeasureModeAtMost:
      maximumSize.width = floatFromYogaFloat(width);
      break;
  }

  switch (heightMode) {
    case YGMeasureModeUndefined:
      break;
    case YGMeasureModeExactly:
      minimumSize.height = floatFromYogaFloat(height);
      maximumSize.height = floatFromYogaFloat(height);
      break;
    case YGMeasureModeAtMost:
      maximumSize.height = floatFromYogaFloat(height);
      break;
  }

  auto layoutContext = ThreadStorage<LayoutContext>::getInstance().get();

  auto size = shadowNodeRawPtr->measureContent(
      layoutContext.value_or(LayoutContext{}), {minimumSize, maximumSize});

  return YGSize{yogaFloatFromFloat(size.width),
                yogaFloatFromFloat(size.height)};
}

#ifdef RN_DEBUG_YOGA_LOGGER
static int YogaLog(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char *format,
    va_list args) {
  int result = vsnprintf(NULL, 0, format, args);
  std::vector<char> buffer(1 + result);
  vsnprintf(buffer.data(), buffer.size(), format, args);
  LOG(INFO) << "RNYogaLogger " << buffer.data();
  return result;
}
#endif

YGConfig &YogaLayoutableShadowNode::initializeYogaConfig(YGConfig &config) {
  config.setCloneNodeCallback(
      YogaLayoutableShadowNode::yogaNodeCloneCallbackConnector);
  config.useLegacyStretchBehaviour = true;
#ifdef RN_DEBUG_YOGA_LOGGER
  config.printTree = true;
  config.setLogger(&YogaLog);
#endif
  return config;
}

#pragma mark - RTL left and right swapping

void YogaLayoutableShadowNode::swapLeftAndRightInTree(
    YogaLayoutableShadowNode const &shadowNode) {
  swapLeftAndRightInYogaStyleProps(shadowNode);
  swapLeftAndRightInViewProps(shadowNode);

  for (auto &child : shadowNode.getChildren()) {
    auto const yogaLayoutableChild =
        traitCast<YogaLayoutableShadowNode const *>(child.get());
    if (yogaLayoutableChild && !yogaLayoutableChild->doesOwn(shadowNode)) {
      swapLeftAndRightInTree(*yogaLayoutableChild);
    }
  }
}

void YogaLayoutableShadowNode::swapLeftAndRightInYogaStyleProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto yogaStyle = shadowNode.yogaNode_.getStyle();

  YGStyle::Edges const &position = yogaStyle.position();
  YGStyle::Edges const &padding = yogaStyle.padding();
  YGStyle::Edges const &margin = yogaStyle.margin();

  // Swap Yoga node values, position, padding and margin.

  if (yogaStyle.position()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.position()[YGEdgeStart] = position[YGEdgeLeft];
    yogaStyle.position()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.position()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.position()[YGEdgeEnd] = position[YGEdgeRight];
    yogaStyle.position()[YGEdgeRight] = YGValueUndefined;
  }

  if (yogaStyle.padding()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.padding()[YGEdgeStart] = padding[YGEdgeLeft];
    yogaStyle.padding()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.padding()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.padding()[YGEdgeEnd] = padding[YGEdgeRight];
    yogaStyle.padding()[YGEdgeRight] = YGValueUndefined;
  }

  if (yogaStyle.margin()[YGEdgeLeft] != YGValueUndefined) {
    yogaStyle.margin()[YGEdgeStart] = margin[YGEdgeLeft];
    yogaStyle.margin()[YGEdgeLeft] = YGValueUndefined;
  }

  if (yogaStyle.margin()[YGEdgeRight] != YGValueUndefined) {
    yogaStyle.margin()[YGEdgeEnd] = margin[YGEdgeRight];
    yogaStyle.margin()[YGEdgeRight] = YGValueUndefined;
  }

  shadowNode.yogaNode_.setStyle(yogaStyle);
}

void YogaLayoutableShadowNode::swapLeftAndRightInViewProps(
    YogaLayoutableShadowNode const &shadowNode) {
  auto &typedCasting = static_cast<ViewProps const &>(*shadowNode.props_);
  auto &props = const_cast<ViewProps &>(typedCasting);

  // Swap border node values, borderRadii, borderColors and borderStyles.
  if (props.borderRadii.topLeft.hasValue()) {
    props.borderRadii.topStart = props.borderRadii.topLeft;
    props.borderRadii.topLeft.clear();
  }

  if (props.borderRadii.bottomLeft.hasValue()) {
    props.borderRadii.bottomStart = props.borderRadii.bottomLeft;
    props.borderRadii.bottomLeft.clear();
  }

  if (props.borderRadii.topRight.hasValue()) {
    props.borderRadii.topEnd = props.borderRadii.topRight;
    props.borderRadii.topRight.clear();
  }

  if (props.borderRadii.bottomRight.hasValue()) {
    props.borderRadii.bottomEnd = props.borderRadii.bottomRight;
    props.borderRadii.bottomRight.clear();
  }

  if (props.borderColors.left.hasValue()) {
    props.borderColors.start = props.borderColors.left;
    props.borderColors.left.clear();
  }

  if (props.borderColors.right.hasValue()) {
    props.borderColors.end = props.borderColors.right;
    props.borderColors.right.clear();
  }

  if (props.borderStyles.left.hasValue()) {
    props.borderStyles.start = props.borderStyles.left;
    props.borderStyles.left.clear();
  }

  if (props.borderStyles.right.hasValue()) {
    props.borderStyles.end = props.borderStyles.right;
    props.borderStyles.right.clear();
  }

  YGStyle::Edges const &border = props.yogaStyle.border();

  if (props.yogaStyle.border()[YGEdgeLeft] != YGValueUndefined) {
    props.yogaStyle.border()[YGEdgeStart] = border[YGEdgeLeft];
    props.yogaStyle.border()[YGEdgeLeft] = YGValueUndefined;
  }

  if (props.yogaStyle.border()[YGEdgeRight] != YGValueUndefined) {
    props.yogaStyle.border()[YGEdgeEnd] = border[YGEdgeRight];
    props.yogaStyle.border()[YGEdgeRight] = YGValueUndefined;
  }
}

#pragma mark - Consistency Ensuring Helpers

void YogaLayoutableShadowNode::ensureConsistency() const {
  ensureYogaChildrenLookFine();
  ensureYogaChildrenAlighment();
  ensureYogaChildrenOwnersConsistency();
}

void YogaLayoutableShadowNode::ensureYogaChildrenOwnersConsistency() const {
#ifndef NDEBUG
  // Checking that all Yoga node children have the same `owner`.
  // The owner might be not equal to the `yogaNode_` though.
  auto &yogaChildren = yogaNode_.getChildren();

  if (!yogaChildren.empty()) {
    auto owner = yogaChildren.at(0)->getOwner();
    for (auto const &child : yogaChildren) {
      assert(child->getOwner() == owner);
    }
  }
#endif
}

void YogaLayoutableShadowNode::ensureYogaChildrenLookFine() const {
#ifndef NDEBUG
  // Checking that the shapes of Yoga node children object look fine.
  // This is the only heuristic that might produce false-positive results
  // (really broken dangled nodes might look fine). This is useful as an early
  // signal that something went wrong.
  auto &yogaChildren = yogaNode_.getChildren();

  for (auto const &yogaChild : yogaChildren) {
    assert(yogaChild->getContext());
    assert(yogaChild->getChildren().size() < 16384);
    if (!yogaChild->getChildren().empty()) {
      assert(!yogaChild->hasMeasureFunc());
    }
  }
#endif
}

void YogaLayoutableShadowNode::ensureYogaChildrenAlighment() const {
#ifndef NDEBUG
  // If the node is not a leaf node, checking that:
  // - All children are `YogaLayoutableShadowNode` subclasses.
  // - All Yoga children are owned/connected to corresponding children of
  //   this node.

  auto &yogaChildren = yogaNode_.getChildren();
  auto &children = getChildren();

  if (getTraits().check(ShadowNodeTraits::Trait::LeafYogaNode)) {
    assert(yogaChildren.empty());
    return;
  }

  assert(yogaChildren.size() == children.size());

  for (size_t i = 0; i < children.size(); i++) {
    auto &yogaChild = yogaChildren.at(i);
    auto &child = children.at(i);
    assert(
        yogaChild->getContext() ==
        traitCast<YogaLayoutableShadowNode const *>(child.get()));
  }
#endif
}

} // namespace react
} // namespace facebook
