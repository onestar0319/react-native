// Copyright 2004-present Facebook. All Rights Reserved.

#include "UIManager.h"

#include <react/core/ShadowNodeFragment.h>
#include <react/debug/SystraceSection.h>
#include <react/uimanager/TimeUtils.h>

namespace facebook {
namespace react {

SharedShadowNode UIManager::createNode(
    Tag tag,
    const ComponentName &name,
    SurfaceId surfaceId,
    const RawProps &rawProps,
    SharedEventTarget eventTarget) const {
  SystraceSection s("UIManager::createNode");

  auto &componentDescriptor = componentDescriptorRegistry_->at(name);
  const auto &props = componentDescriptor.cloneProps(nullptr, rawProps);
  const auto &state = componentDescriptor.createInitialState(props);

  auto shadowNode = componentDescriptor.createShadowNode(
      {.tag = tag,
       .rootTag = surfaceId,
       .eventEmitter =
           componentDescriptor.createEventEmitter(std::move(eventTarget), tag),
       .props = props,
       .state = state});

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return shadowNode;
}

SharedShadowNode UIManager::cloneNode(
    const SharedShadowNode &shadowNode,
    const SharedShadowNodeSharedList &children,
    const RawProps *rawProps) const {
  SystraceSection s("UIManager::cloneNode");

  auto &componentDescriptor =
      componentDescriptorRegistry_->at(shadowNode->getComponentHandle());

  auto clonedShadowNode = componentDescriptor.cloneShadowNode(
      *shadowNode,
      {
          .props = rawProps ? componentDescriptor.cloneProps(
                                  shadowNode->getProps(), *rawProps)
                            : ShadowNodeFragment::propsPlaceholder(),
          .children = children,
      });

  return clonedShadowNode;
}

void UIManager::appendChild(
    const SharedShadowNode &parentShadowNode,
    const SharedShadowNode &childShadowNode) const {
  SystraceSection s("UIManager::appendChild");

  auto &componentDescriptor =
      componentDescriptorRegistry_->at(parentShadowNode->getComponentHandle());
  componentDescriptor.appendChild(parentShadowNode, childShadowNode);
}

void UIManager::completeSurface(
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildren) const {
  SystraceSection s("UIManager::completeSurface");

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(
        surfaceId, rootChildren, getTime());
  }
}

void UIManager::setNativeProps(
    const SharedShadowNode &shadowNode,
    const RawProps &rawProps) const {
  SystraceSection s("UIManager::setNativeProps");

  long startCommitTime = getTime();

  auto &componentDescriptor =
      componentDescriptorRegistry_->at(shadowNode->getComponentHandle());
  auto props = componentDescriptor.cloneProps(shadowNode->getProps(), rawProps);
  auto newShadowNode = shadowNode->clone(ShadowNodeFragment{.props = props});

  shadowTreeRegistry_->visit(
      shadowNode->getRootTag(), [&](const ShadowTree &shadowTree) {
        shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              return oldRootShadowNode->clone(shadowNode, newShadowNode);
            },
            startCommitTime);
      });
}

LayoutMetrics UIManager::getRelativeLayoutMetrics(
    const ShadowNode &shadowNode,
    const ShadowNode *ancestorShadowNode) const {
  SystraceSection s("UIManager::getRelativeLayoutMetrics");

  long startCommitTime = getTime();

  if (!ancestorShadowNode) {
    shadowTreeRegistry_->visit(
        shadowNode.getRootTag(), [&](const ShadowTree &shadowTree) {
          shadowTree.tryCommit(
              [&](const SharedRootShadowNode &oldRootShadowNode) {
                ancestorShadowNode = oldRootShadowNode.get();
                return nullptr;
              },
              startCommitTime);
        });
  }

  auto layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(&shadowNode);
  auto layoutableAncestorShadowNode =
      dynamic_cast<const LayoutableShadowNode *>(ancestorShadowNode);

  if (!layoutableShadowNode || !layoutableAncestorShadowNode) {
    return EmptyLayoutMetrics;
  }

  return layoutableShadowNode->getRelativeLayoutMetrics(
      *layoutableAncestorShadowNode);
}

void UIManager::updateState(
    const SharedShadowNode &shadowNode,
    const StateData::Shared &rawStateData) const {
  long startCommitTime = getTime();

  auto &componentDescriptor =
      componentDescriptorRegistry_->at(shadowNode->getComponentHandle());
  auto state =
      componentDescriptor.createState(shadowNode->getState(), rawStateData);
  auto newShadowNode = shadowNode->clone(ShadowNodeFragment{.state = state});

  shadowTreeRegistry_->visit(
      shadowNode->getRootTag(), [&](const ShadowTree &shadowTree) {
        shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              return oldRootShadowNode->clone(shadowNode, newShadowNode);
            },
            startCommitTime);
      });
}

void UIManager::setShadowTreeRegistry(ShadowTreeRegistry *shadowTreeRegistry) {
  shadowTreeRegistry_ = shadowTreeRegistry;
}

void UIManager::setComponentDescriptorRegistry(
    const SharedComponentDescriptorRegistry &componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void UIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *UIManager::getDelegate() {
  return delegate_;
}

} // namespace react
} // namespace facebook
