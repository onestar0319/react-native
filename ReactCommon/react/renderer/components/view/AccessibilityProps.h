/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class AccessibilityProps {
 public:
  AccessibilityProps() = default;
  AccessibilityProps(
      const PropsParserContext &context,
      AccessibilityProps const &sourceProps,
      RawProps const &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

  static bool enablePropIteratorSetter;

#ifdef ANDROID
  void propsDiffMapBuffer(Props const *oldProps, MapBufferBuilder &builder)
      const;
#endif

#pragma mark - Props

  bool accessible{false};
  AccessibilityState accessibilityState;
  std::string accessibilityLabel{""};
  AccessibilityLabelledBy accessibilityLabelledBy{};
  AccessibilityLiveRegion accessibilityLiveRegion{
      AccessibilityLiveRegion::None};
  AccessibilityTraits accessibilityTraits{AccessibilityTraits::None};
  std::string accessibilityRole{""};
  std::string accessibilityHint{""};
  std::string accessibilityLanguage{""};
  AccessibilityValue accessibilityValue;
  std::vector<AccessibilityAction> accessibilityActions{};
  bool accessibilityViewIsModal{false};
  bool accessibilityElementsHidden{false};
  bool accessibilityIgnoresInvertColors{false};
  bool onAccessibilityTap{};
  bool onAccessibilityMagicTap{};
  bool onAccessibilityEscape{};
  bool onAccessibilityAction{};
  ImportantForAccessibility importantForAccessibility{
      ImportantForAccessibility::Auto};
  std::string testId{""};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace react
} // namespace facebook
