// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ComponentDescriptorRegistry.h"

#include <fabric/core/ShadowNodeFragment.h>

namespace facebook {
namespace react {

void ComponentDescriptorRegistry::registerComponentDescriptor(
    SharedComponentDescriptor componentDescriptor) {
  ComponentHandle componentHandle = componentDescriptor->getComponentHandle();
  _registryByHandle[componentHandle] = componentDescriptor;

  ComponentName componentName = componentDescriptor->getComponentName();
  _registryByName[componentName] = componentDescriptor;
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](
    const SharedShadowNode &shadowNode) const {
  ComponentHandle componentHandle = shadowNode->getComponentHandle();
  return _registryByHandle.at(componentHandle);
}

const SharedComponentDescriptor ComponentDescriptorRegistry::operator[](
    const ComponentName &componentName) const {
  auto it = _registryByName.find(componentName);
  if (it == _registryByName.end()) {
    throw std::invalid_argument(
        ("Unable to find componentDescriptor for " + componentName).c_str());
  }
  return it->second;
}

static const std::string componentNameByReactViewName(std::string viewName) {
  // We need this function only for the transition period;
  // eventually, all names will be unified.

  std::string rctPrefix("RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin())
          .first == rctPrefix.end()) {
    // If `viewName` has "RCT" prefix, remove it.
    viewName.erase(0, rctPrefix.length());
  }

  // Fabric uses slightly new names for Text components because of differences
  // in semantic.
  if (viewName == "Text") {
    return "Paragraph";
  }
  if (viewName == "VirtualText") {
    return "Text";
  }

  if (viewName == "ImageView") {
    return "Image";
  }

  if (viewName == "AndroidHorizontalScrollView") {
    return "ScrollView";
  }

  if (viewName == "AndroidProgressBar") {
    return "ActivityIndicatorView";
  }

  // We need this temporarly for testing purposes until we have proper
  // implementation of core components.
  if (viewName == "SinglelineTextInputView" ||
      viewName == "MultilineTextInputView" || viewName == "RefreshControl" ||
      viewName == "SafeAreaView" || viewName == "ScrollContentView" ||
      viewName == "AndroidHorizontalScrollContentView" // Android
  ) {
    return "View";
  }

  return viewName;
}

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

SharedShadowNode ComponentDescriptorRegistry::createNode(Tag tag, const std::string &viewName, Tag rootTag, const folly::dynamic &props, const SharedEventTarget &eventTarget) const {
  ComponentName componentName = componentNameByReactViewName(viewName);
  const SharedComponentDescriptor &componentDescriptor = (*this)[componentName];
  RawProps rawProps = rawPropsFromDynamic(props);

  SharedShadowNode shadowNode =
    componentDescriptor->createShadowNode({
      .tag = tag,
      .rootTag = rootTag,
      .eventEmitter = componentDescriptor->createEventEmitter(std::move(eventTarget), tag),
      .props = componentDescriptor->cloneProps(nullptr, rawProps)
    });
  return shadowNode;
}

} // namespace react
} // namespace facebook
