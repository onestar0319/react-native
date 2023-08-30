/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <array>
#include <cstdint>
#include <type_traits>

#include <yoga/Yoga.h>
#include <yoga/Yoga-internal.h>

#include <yoga/bits/NumericBitfield.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/CompactValue.h>

namespace facebook::yoga {

class YOGA_EXPORT Style {
  template <typename Enum>
  using Values = detail::Values<enums::count<Enum>()>;

public:
  using Dimensions = Values<YGDimension>;
  using Edges = Values<YGEdge>;
  using Gutters = Values<YGGutter>;

  template <typename T>
  struct BitfieldRef {
    Style& style;
    size_t offset;
    operator T() const { return getEnumData<T>(style.flags, offset); }
    BitfieldRef<T>& operator=(T x) {
      setEnumData<T>(style.flags, offset, x);
      return *this;
    }
  };

  template <typename T, T Style::*Prop>
  struct Ref {
    Style& style;
    operator T() const { return style.*Prop; }
    Ref<T, Prop>& operator=(T value) {
      style.*Prop = value;
      return *this;
    }
  };

  template <typename Idx, Values<Idx> Style::*Prop>
  struct IdxRef {
    struct Ref {
      Style& style;
      Idx idx;
      operator CompactValue() const { return (style.*Prop)[idx]; }
      operator YGValue() const { return (style.*Prop)[idx]; }
      Ref& operator=(CompactValue value) {
        (style.*Prop)[idx] = value;
        return *this;
      }
    };

    Style& style;
    IdxRef<Idx, Prop>& operator=(const Values<Idx>& values) {
      style.*Prop = values;
      return *this;
    }
    operator const Values<Idx>&() const { return style.*Prop; }
    Ref operator[](Idx idx) { return {style, idx}; }
    CompactValue operator[](Idx idx) const { return (style.*Prop)[idx]; }
  };

  Style() {
    alignContent() = YGAlignFlexStart;
    alignItems() = YGAlignStretch;
  }
  ~Style() = default;

private:
  static constexpr size_t directionOffset = 0;
  static constexpr size_t flexdirectionOffset =
      directionOffset + minimumBitCount<YGDirection>();
  static constexpr size_t justifyContentOffset =
      flexdirectionOffset + minimumBitCount<YGFlexDirection>();
  static constexpr size_t alignContentOffset =
      justifyContentOffset + minimumBitCount<YGJustify>();
  static constexpr size_t alignItemsOffset =
      alignContentOffset + minimumBitCount<YGAlign>();
  static constexpr size_t alignSelfOffset =
      alignItemsOffset + minimumBitCount<YGAlign>();
  static constexpr size_t positionTypeOffset =
      alignSelfOffset + minimumBitCount<YGAlign>();
  static constexpr size_t flexWrapOffset =
      positionTypeOffset + minimumBitCount<YGPositionType>();
  static constexpr size_t overflowOffset =
      flexWrapOffset + minimumBitCount<YGWrap>();
  static constexpr size_t displayOffset =
      overflowOffset + minimumBitCount<YGOverflow>();

  uint32_t flags = 0;

  FloatOptional flex_ = {};
  FloatOptional flexGrow_ = {};
  FloatOptional flexShrink_ = {};
  CompactValue flexBasis_ = CompactValue::ofAuto();
  Edges margin_ = {};
  Edges position_ = {};
  Edges padding_ = {};
  Edges border_ = {};
  Gutters gap_ = {};
  Dimensions dimensions_{CompactValue::ofAuto()};
  Dimensions minDimensions_ = {};
  Dimensions maxDimensions_ = {};
  // Yoga specific properties, not compatible with flexbox specification
  FloatOptional aspectRatio_ = {};

public:
  // for library users needing a type
  using ValueRepr = std::remove_reference<decltype(margin_[0])>::type;

  YGDirection direction() const {
    return getEnumData<YGDirection>(flags, directionOffset);
  }
  BitfieldRef<YGDirection> direction() { return {*this, directionOffset}; }

  YGFlexDirection flexDirection() const {
    return getEnumData<YGFlexDirection>(flags, flexdirectionOffset);
  }
  BitfieldRef<YGFlexDirection> flexDirection() {
    return {*this, flexdirectionOffset};
  }

  YGJustify justifyContent() const {
    return getEnumData<YGJustify>(flags, justifyContentOffset);
  }
  BitfieldRef<YGJustify> justifyContent() {
    return {*this, justifyContentOffset};
  }

  YGAlign alignContent() const {
    return getEnumData<YGAlign>(flags, alignContentOffset);
  }
  BitfieldRef<YGAlign> alignContent() { return {*this, alignContentOffset}; }

  YGAlign alignItems() const {
    return getEnumData<YGAlign>(flags, alignItemsOffset);
  }
  BitfieldRef<YGAlign> alignItems() { return {*this, alignItemsOffset}; }

  YGAlign alignSelf() const {
    return getEnumData<YGAlign>(flags, alignSelfOffset);
  }
  BitfieldRef<YGAlign> alignSelf() { return {*this, alignSelfOffset}; }

  YGPositionType positionType() const {
    return getEnumData<YGPositionType>(flags, positionTypeOffset);
  }
  BitfieldRef<YGPositionType> positionType() {
    return {*this, positionTypeOffset};
  }

  YGWrap flexWrap() const { return getEnumData<YGWrap>(flags, flexWrapOffset); }
  BitfieldRef<YGWrap> flexWrap() { return {*this, flexWrapOffset}; }

  YGOverflow overflow() const {
    return getEnumData<YGOverflow>(flags, overflowOffset);
  }
  BitfieldRef<YGOverflow> overflow() { return {*this, overflowOffset}; }

  YGDisplay display() const {
    return getEnumData<YGDisplay>(flags, displayOffset);
  }
  BitfieldRef<YGDisplay> display() { return {*this, displayOffset}; }

  FloatOptional flex() const { return flex_; }
  Ref<FloatOptional, &Style::flex_> flex() { return {*this}; }

  FloatOptional flexGrow() const { return flexGrow_; }
  Ref<FloatOptional, &Style::flexGrow_> flexGrow() { return {*this}; }

  FloatOptional flexShrink() const { return flexShrink_; }
  Ref<FloatOptional, &Style::flexShrink_> flexShrink() { return {*this}; }

  CompactValue flexBasis() const { return flexBasis_; }
  Ref<CompactValue, &Style::flexBasis_> flexBasis() { return {*this}; }

  const Edges& margin() const { return margin_; }
  IdxRef<YGEdge, &Style::margin_> margin() { return {*this}; }

  const Edges& position() const { return position_; }
  IdxRef<YGEdge, &Style::position_> position() { return {*this}; }

  const Edges& padding() const { return padding_; }
  IdxRef<YGEdge, &Style::padding_> padding() { return {*this}; }

  const Edges& border() const { return border_; }
  IdxRef<YGEdge, &Style::border_> border() { return {*this}; }

  const Gutters& gap() const { return gap_; }
  IdxRef<YGGutter, &Style::gap_> gap() { return {*this}; }

  const Dimensions& dimensions() const { return dimensions_; }
  IdxRef<YGDimension, &Style::dimensions_> dimensions() { return {*this}; }

  const Dimensions& minDimensions() const { return minDimensions_; }
  IdxRef<YGDimension, &Style::minDimensions_> minDimensions() {
    return {*this};
  }

  const Dimensions& maxDimensions() const { return maxDimensions_; }
  IdxRef<YGDimension, &Style::maxDimensions_> maxDimensions() {
    return {*this};
  }

  // Yoga specific properties, not compatible with flexbox specification
  FloatOptional aspectRatio() const { return aspectRatio_; }
  Ref<FloatOptional, &Style::aspectRatio_> aspectRatio() { return {*this}; }
};

YOGA_EXPORT bool operator==(const Style& lhs, const Style& rhs);
YOGA_EXPORT inline bool operator!=(const Style& lhs, const Style& rhs) {
  return !(lhs == rhs);
}
} // namespace facebook::yoga
