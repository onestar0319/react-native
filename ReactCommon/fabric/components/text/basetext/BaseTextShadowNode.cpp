/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseTextShadowNode.h"

#include <fabric/components/text/RawTextShadowNode.h>
#include <fabric/components/text/RawTextProps.h>
#include <fabric/components/text/TextShadowNode.h>
#include <fabric/components/text/TextProps.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

AttributedString BaseTextShadowNode::getAttributedString(
  const TextAttributes &textAttributes,
  const SharedShadowNode &parentNode
) const {
  auto attributedString = AttributedString {};

  for (const auto &childNode : parentNode->getChildren()) {
    // RawShadowNode
    auto rawTextShadowNode = std::dynamic_pointer_cast<const RawTextShadowNode>(childNode);
    if (rawTextShadowNode) {
      auto fragment = AttributedString::Fragment {};
      fragment.string = rawTextShadowNode->getProps()->text;
      fragment.textAttributes = textAttributes;
      fragment.parentShadowNode = parentNode;
      attributedString.appendFragment(fragment);
      continue;
    }

    // TextShadowNode
    auto textShadowNode = std::dynamic_pointer_cast<const TextShadowNode>(childNode);
    if (textShadowNode) {
      auto localTextAttributes = textAttributes;
      localTextAttributes.apply(textShadowNode->getProps()->textAttributes);
      attributedString.appendAttributedString(textShadowNode->getAttributedString(localTextAttributes, textShadowNode));
      continue;
    }

    // Any other kind of ShadowNode
    auto fragment = AttributedString::Fragment {};
    fragment.shadowNode = childNode;
    fragment.textAttributes = textAttributes;
    attributedString.appendFragment(fragment);
  }

  return attributedString;
}

} // namespace react
} // namespace facebook
