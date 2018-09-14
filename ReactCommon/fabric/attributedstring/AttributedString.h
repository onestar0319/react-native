/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <fabric/attributedstring/TextAttributes.h>
#include <fabric/core/Sealable.h>
#include <fabric/core/ShadowNode.h>
#include <fabric/debug/DebugStringConvertible.h>
#include <folly/Optional.h>

namespace facebook {
namespace react {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * Simple, cross-platfrom, React-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString:
  public Sealable,
  public DebugStringConvertible {

public:

  class Fragment {

  public:
    std::string string;
    TextAttributes textAttributes;
    SharedShadowNode shadowNode;
    SharedShadowNode parentShadowNode;

    bool operator==(const Fragment &rhs) const;
    bool operator!=(const Fragment &rhs) const;
  };

  using Fragments = std::vector<Fragment>;

  /*
   * Appends and prepends a `fragment` to the string.
   */
  void appendFragment(const Fragment &fragment);
  void prependFragment(const Fragment &fragment);

  /*
   * Appends and prepends an `attributedString` (all its fragments) to
   * the string.
   */
  void appendAttributedString(const AttributedString &attributedString);
  void prependAttributedString(const AttributedString &attributedString);

  /*
   * Returns read-only reference to a list of fragments.
   */
  const Fragments &getFragments() const;

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  bool operator==(const AttributedString &rhs) const;
  bool operator!=(const AttributedString &rhs) const;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugChildren() const override;

private:

  Fragments fragments_;
};

} // namespace react
} // namespace facebook

namespace std {
  template <>
  struct hash<facebook::react::AttributedString::Fragment> {
    size_t operator()(const facebook::react::AttributedString::Fragment &fragment) const {
      return
        std::hash<decltype(fragment.string)>{}(fragment.string) +
        std::hash<decltype(fragment.textAttributes)>{}(fragment.textAttributes) +
        std::hash<decltype(fragment.shadowNode)>{}(fragment.shadowNode) +
        std::hash<decltype(fragment.parentShadowNode)>{}(fragment.parentShadowNode);
    }
  };

  template <>
  struct hash<facebook::react::AttributedString> {
    size_t operator()(const facebook::react::AttributedString &attributedString) const {
      auto result = size_t {0};

      for (const auto &fragment : attributedString.getFragments()) {
        result += std::hash<facebook::react::AttributedString::Fragment>{}(fragment);
      }

      return result;
    }
  };
} // namespace std
