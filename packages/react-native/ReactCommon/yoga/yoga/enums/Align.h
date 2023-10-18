/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @generated by enums.py
// clang-format off
#pragma once

#include <cstdint>
#include <yoga/YGEnums.h>
#include <yoga/enums/YogaEnums.h>

namespace facebook::yoga {

enum class Align : uint8_t {
  Auto = YGAlignAuto,
  FlexStart = YGAlignFlexStart,
  Center = YGAlignCenter,
  FlexEnd = YGAlignFlexEnd,
  Stretch = YGAlignStretch,
  Baseline = YGAlignBaseline,
  SpaceBetween = YGAlignSpaceBetween,
  SpaceAround = YGAlignSpaceAround,
  SpaceEvenly = YGAlignSpaceEvenly,
};

template <>
constexpr inline int32_t ordinalCount<Align>() {
  return 9;
} 

template <>
constexpr inline int32_t bitCount<Align>() {
  return 4;
} 

constexpr inline Align scopedEnum(YGAlign unscoped) {
  return static_cast<Align>(unscoped);
}

constexpr inline YGAlign unscopedEnum(Align scoped) {
  return static_cast<YGAlign>(scoped);
}

inline const char* toString(Align e) {
  return YGAlignToString(unscopedEnum(e));
}

} // namespace facebook::yoga
