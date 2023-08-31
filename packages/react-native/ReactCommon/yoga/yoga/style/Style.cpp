/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/style/Style.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

// Yoga specific properties, not compatible with flexbox specification
bool operator==(const Style& lhs, const Style& rhs) {
  bool areNonFloatValuesEqual = lhs.direction() == rhs.direction() &&
      lhs.flexDirection() == rhs.flexDirection() &&
      lhs.justifyContent() == rhs.justifyContent() &&
      lhs.alignContent() == rhs.alignContent() &&
      lhs.alignItems() == rhs.alignItems() &&
      lhs.alignSelf() == rhs.alignSelf() &&
      lhs.positionType() == rhs.positionType() &&
      lhs.flexWrap() == rhs.flexWrap() && lhs.overflow() == rhs.overflow() &&
      lhs.display() == rhs.display() &&
      yoga::inexactEquals(lhs.flexBasis(), rhs.flexBasis()) &&
      lhs.margin() == rhs.margin() && lhs.position() == rhs.position() &&
      lhs.padding() == rhs.padding() && lhs.border() == rhs.border() &&
      lhs.gap() == rhs.gap() && lhs.dimensions() == rhs.dimensions() &&
      lhs.minDimensions() == rhs.minDimensions() &&
      lhs.maxDimensions() == rhs.maxDimensions();

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      lhs.flex().isUndefined() == rhs.flex().isUndefined();
  if (areNonFloatValuesEqual && !lhs.flex().isUndefined() &&
      !rhs.flex().isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && lhs.flex() == rhs.flex();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      lhs.flexGrow().isUndefined() == rhs.flexGrow().isUndefined();
  if (areNonFloatValuesEqual && !lhs.flexGrow().isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && lhs.flexGrow() == rhs.flexGrow();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      lhs.flexShrink().isUndefined() == rhs.flexShrink().isUndefined();
  if (areNonFloatValuesEqual && !rhs.flexShrink().isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && lhs.flexShrink() == rhs.flexShrink();
  }

  if (!(lhs.aspectRatio().isUndefined() && rhs.aspectRatio().isUndefined())) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && lhs.aspectRatio() == rhs.aspectRatio();
  }

  return areNonFloatValuesEqual;
}

} // namespace facebook::yoga
