/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <type_traits>
#include "CompactValue.h"
#include "YGEnums.h"
#include "YGFloatOptional.h"
#include "Yoga-internal.h"
#include "Yoga.h"

#if !defined(ENUM_BITFIELDS_NOT_SUPPORTED)
#define BITFIELD_ENUM_SIZED(num) : num
#else
#define BITFIELD_ENUM_SIZED(num)
#endif

#define BITFIELD_ACCESSORS(FIELD)                             \
  decltype(FIELD##_) get_##FIELD() const { return FIELD##_; } \
  void set_##FIELD(decltype(FIELD##_) x) { FIELD##_ = x; }

#define BITFIELD_REF(FIELD) \
  { *this, &YGStyle::get_##FIELD, &YGStyle::set_##FIELD }

class YGStyle {
  template <typename Enum>
  using Values =
      facebook::yoga::detail::Values<facebook::yoga::enums::count<Enum>()>;
  using CompactValue = facebook::yoga::detail::CompactValue;

public:
  using Dimensions = Values<YGDimension>;
  using Edges = Values<YGEdge>;

  template <typename T, T YGStyle::*Prop>
  struct Ref {
    YGStyle& style;
    operator T() const { return style.*Prop; }
    Ref<T, Prop>& operator=(T value) {
      style.*Prop = value;
      return *this;
    }
  };

  template <typename Idx, Values<Idx> YGStyle::*Prop>
  struct IdxRef {
    struct Ref {
      YGStyle& style;
      Idx idx;
      operator CompactValue() const { return (style.*Prop)[idx]; }
      operator YGValue() const { return (style.*Prop)[idx]; }
      Ref& operator=(CompactValue value) {
        (style.*Prop)[idx] = value;
        return *this;
      }
    };

    YGStyle& style;
    IdxRef<Idx, Prop>& operator=(const Values<Idx>& values) {
      style.*Prop = values;
      return *this;
    }
    operator const Values<Idx>&() const { return style.*Prop; }
    Ref operator[](Idx idx) { return {style, idx}; }
    CompactValue operator[](Idx idx) const { return (style.*Prop)[idx]; }
  };

  template <typename T>
  struct BitfieldRef {
    YGStyle& style;
    T (YGStyle::*get)() const;
    void (YGStyle::*set)(T);

    operator T() const { return (style.*get)(); }
    BitfieldRef<T>& operator=(T x) {
      (style.*set)(x);
      return *this;
    }
  };

  YGStyle()
      : direction_(YGDirectionInherit),
        flexDirection_(YGFlexDirectionColumn),
        justifyContent_(YGJustifyFlexStart),
        alignContent_(YGAlignFlexStart),
        alignItems_(YGAlignStretch),
        alignSelf_(YGAlignAuto),
        positionType_(YGPositionTypeRelative),
        flexWrap_(YGWrapNoWrap),
        overflow_(YGOverflowVisible),
        display_(YGDisplayFlex) {}
  ~YGStyle() = default;

private:
  /* Some platforms don't support enum bitfields,
     so please use BITFIELD_ENUM_SIZED(BITS_COUNT) */
  YGDirection direction_ BITFIELD_ENUM_SIZED(2);
  YGFlexDirection flexDirection_ BITFIELD_ENUM_SIZED(2);
  YGJustify justifyContent_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignContent_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignItems_ BITFIELD_ENUM_SIZED(3);
  YGAlign alignSelf_ BITFIELD_ENUM_SIZED(3);
  YGPositionType positionType_ BITFIELD_ENUM_SIZED(1);
  YGWrap flexWrap_ BITFIELD_ENUM_SIZED(2);
  YGOverflow overflow_ BITFIELD_ENUM_SIZED(2);
  YGDisplay display_ BITFIELD_ENUM_SIZED(1);
  YGFloatOptional flex_ = {};
  YGFloatOptional flexGrow_ = {};
  YGFloatOptional flexShrink_ = {};
  CompactValue flexBasis_ = CompactValue::ofAuto();
  Edges margin_ = {};
  Edges position_ = {};
  Edges padding_ = {};
  Edges border_ = {};
  Dimensions dimensions_{CompactValue::ofAuto()};
  Dimensions minDimensions_ = {};
  Dimensions maxDimensions_ = {};
  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio_ = {};

public:
  // for library users needing a type
  using ValueRepr = std::remove_reference<decltype(margin_[0])>::type;

  YGDirection direction() const { return direction_; }
  BitfieldRef<YGDirection> direction() { return BITFIELD_REF(direction); }

  YGFlexDirection flexDirection() const { return flexDirection_; }
  BitfieldRef<YGFlexDirection> flexDirection() {
    return BITFIELD_REF(flexDirection);
  }

  YGJustify justifyContent() const { return justifyContent_; }
  BitfieldRef<YGJustify> justifyContent() {
    return BITFIELD_REF(justifyContent);
  }

  YGAlign alignContent() const { return alignContent_; }
  BitfieldRef<YGAlign> alignContent() { return BITFIELD_REF(alignContent); }

  YGAlign alignItems() const { return alignItems_; }
  BitfieldRef<YGAlign> alignItems() { return BITFIELD_REF(alignItems); }

  YGAlign alignSelf() const { return alignSelf_; }
  BitfieldRef<YGAlign> alignSelf() { return BITFIELD_REF(alignSelf); }

  YGPositionType positionType() const { return positionType_; }
  BitfieldRef<YGPositionType> positionType() {
    return BITFIELD_REF(positionType);
  }

  YGWrap flexWrap() const { return flexWrap_; }
  BitfieldRef<YGWrap> flexWrap() { return BITFIELD_REF(flexWrap); }

  YGOverflow overflow() const { return overflow_; }
  BitfieldRef<YGOverflow> overflow() { return BITFIELD_REF(overflow); }

  YGDisplay display() const { return display_; }
  BitfieldRef<YGDisplay> display() { return BITFIELD_REF(display); }

  YGFloatOptional flex() const { return flex_; }
  Ref<YGFloatOptional, &YGStyle::flex_> flex() { return {*this}; }

  YGFloatOptional flexGrow() const { return flexGrow_; }
  Ref<YGFloatOptional, &YGStyle::flexGrow_> flexGrow() { return {*this}; }

  YGFloatOptional flexShrink() const { return flexShrink_; }
  Ref<YGFloatOptional, &YGStyle::flexShrink_> flexShrink() { return {*this}; }

  CompactValue flexBasis() const { return flexBasis_; }
  Ref<CompactValue, &YGStyle::flexBasis_> flexBasis() { return {*this}; }

  const Edges& margin() const { return margin_; }
  IdxRef<YGEdge, &YGStyle::margin_> margin() { return {*this}; }

  const Edges& position() const { return position_; }
  IdxRef<YGEdge, &YGStyle::position_> position() { return {*this}; }

  const Edges& padding() const { return padding_; }
  IdxRef<YGEdge, &YGStyle::padding_> padding() { return {*this}; }

  const Edges& border() const { return border_; }
  IdxRef<YGEdge, &YGStyle::border_> border() { return {*this}; }

  const Dimensions& dimensions() const { return dimensions_; }
  IdxRef<YGDimension, &YGStyle::dimensions_> dimensions() { return {*this}; }

  const Dimensions& minDimensions() const { return minDimensions_; }
  IdxRef<YGDimension, &YGStyle::minDimensions_> minDimensions() {
    return {*this};
  }

  const Dimensions& maxDimensions() const { return maxDimensions_; }
  IdxRef<YGDimension, &YGStyle::maxDimensions_> maxDimensions() {
    return {*this};
  }

  // Yoga specific properties, not compatible with flexbox specification
  YGFloatOptional aspectRatio() const { return aspectRatio_; }
  Ref<YGFloatOptional, &YGStyle::aspectRatio_> aspectRatio() { return {*this}; }

private:
  BITFIELD_ACCESSORS(direction)
  BITFIELD_ACCESSORS(flexDirection)
  BITFIELD_ACCESSORS(justifyContent)
  BITFIELD_ACCESSORS(alignContent);
  BITFIELD_ACCESSORS(alignItems);
  BITFIELD_ACCESSORS(alignSelf);
  BITFIELD_ACCESSORS(positionType);
  BITFIELD_ACCESSORS(flexWrap);
  BITFIELD_ACCESSORS(overflow);
  BITFIELD_ACCESSORS(display);
};

bool operator==(const YGStyle& lhs, const YGStyle& rhs);
inline bool operator!=(const YGStyle& lhs, const YGStyle& rhs) {
  return !(lhs == rhs);
}

#undef BITFIELD_ENUM_SIZED
#undef BITFIELD_ACCESSORS
#undef BITFIELD_REF
