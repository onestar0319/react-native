/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricUIManager.h"

#include <glog/logging.h>

#include <fabric/core/componentDescriptor.h>
#include <fabric/core/LayoutContext.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <fabric/view/ViewComponentDescriptor.h>
#include <fabric/view/ViewProps.h>
#include <fabric/view/ViewShadowNode.h>

namespace facebook {
namespace react {

static const RawProps rawPropsFromDynamic(const folly::dynamic object) {
  // TODO: Convert this to something smarter, probably returning `std::iterator`.
  RawProps result;

  if (object.isNull()) {
    return result;
  }

  assert(object.isObject());

  for (const auto &pair : object.items()) {
    assert(pair.first.isString());
    result[pair.first.asString()] = pair.second;
  }

  return result;
}

static const std::string componentNameByReactViewName(std::string viewName) {
  std::string rctPrefix("RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin()).first == rctPrefix.end()) {
    // If `viewName` has "RCT" prefix, remove it.
    viewName.erase(0, 3);
  }

  return viewName;
}

FabricUIManager::FabricUIManager(SharedComponentDescriptorRegistry componentDescriptorRegistry) {
  componentDescriptorRegistry_ = componentDescriptorRegistry;
}

void FabricUIManager::setDelegate(UIManagerDelegate *delegate) {
  delegate_ = delegate;
}

UIManagerDelegate *FabricUIManager::getDelegate() {
  return delegate_;
}

SharedShadowNode FabricUIManager::createNode(int tag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) {
  LOG(INFO) << "FabricUIManager::createNode(tag: " << tag << ", name: " << viewName << ", rootTag" << rootTag << ", props: " << props << ")";

  ComponentName componentName = componentNameByReactViewName(viewName);
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[componentName];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode shadowNode =
    componentDescriptor->createShadowNode(
      tag,
      rootTag,
      instanceHandle,
      componentDescriptor->cloneProps(nullptr, rawProps)
    );

  LOG(INFO) << "FabricUIManager::createNode() -> " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});

  if (delegate_) {
    delegate_->uiManagerDidCreateShadowNode(shadowNode);
  }

  return shadowNode;
}

SharedShadowNode FabricUIManager::cloneNode(const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::cloneNode(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(shadowNode);

  LOG(INFO) << "FabricUIManager::cloneNode() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildren(const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  // Assuming semantic: Cloning with same props but empty children.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      shadowNode,
      nullptr,
      ShadowNode::emptySharedShadowNodeSharedList()
    );

  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildren() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with same children and specified props.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      shadowNode,
      componentDescriptor->cloneProps(shadowNode->getProps(), rawProps),
      nullptr
    );

  LOG(INFO) << "FabricUIManager::cloneNodeWithNewProps() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

SharedShadowNode FabricUIManager::cloneNodeWithNewChildrenAndProps(const SharedShadowNode &shadowNode, folly::dynamic props) {
  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps(shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", props: " << props << ")";
  // Assuming semantic: Cloning with empty children and specified props.
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[shadowNode];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode clonedShadowNode =
    componentDescriptor->cloneShadowNode(
      shadowNode,
      componentDescriptor->cloneProps(shadowNode->getProps(), rawProps),
      ShadowNode::emptySharedShadowNodeSharedList()
    );

  LOG(INFO) << "FabricUIManager::cloneNodeWithNewChildrenAndProps() -> " << clonedShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false});
  return clonedShadowNode;
}

void FabricUIManager::appendChild(const SharedShadowNode &parentShadowNode, const SharedShadowNode &childShadowNode) {
  LOG(INFO) << "FabricUIManager::appendChild(parentShadowNode: " << parentShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ", childShadowNode: " << childShadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  const SharedComponentDescriptor &componentDescriptor = (*componentDescriptorRegistry_)[parentShadowNode];

  // TODO: Remove this after we move this to JS side.
  if (childShadowNode->getSealed()) {
    auto childComponentDescriptor = (*componentDescriptorRegistry_)[childShadowNode];
    auto clonedChildShadowNode = childComponentDescriptor->cloneShadowNode(childShadowNode);
    auto nonConstClonedChildShadowNode = std::const_pointer_cast<ShadowNode>(clonedChildShadowNode);
    nonConstClonedChildShadowNode->shallowSourceNode();
    componentDescriptor->appendChild(parentShadowNode, clonedChildShadowNode);
    return;
  }

  componentDescriptor->appendChild(parentShadowNode, childShadowNode);
}

SharedShadowNodeUnsharedList FabricUIManager::createChildSet(int rootTag) {
  LOG(INFO) << "FabricUIManager::createChildSet(rootTag: " << rootTag << ")";
  return std::make_shared<SharedShadowNodeList>(SharedShadowNodeList({}));
}

void FabricUIManager::appendChildToSet(const SharedShadowNodeUnsharedList &shadowNodeList, const SharedShadowNode &shadowNode) {
  LOG(INFO) << "FabricUIManager::appendChildToSet(shadowNodeList: " << shadowNodeList << ", shadowNode: " << shadowNode->getDebugDescription(DebugStringConvertibleOptions {.format = false}) << ")";
  shadowNodeList->push_back(shadowNode);
}

void FabricUIManager::completeRoot(int rootTag, const SharedShadowNodeUnsharedList &children) {
  LOG(INFO) << "FabricUIManager::completeRoot(rootTag: " << rootTag << ", shadowNodeList: " << children << ")";

  if (delegate_) {
    delegate_->uiManagerDidFinishTransaction(rootTag, children);
  }
}

} // namespace react
} // namespace facebook
