/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "graphicValuesConversions.h"

namespace facebook {
namespace react {

SharedColor colorFromDynamic(folly::dynamic value) {
  float red;
  float green;
  float blue;
  float alpha;

  if (value.isNumber()) {
    auto argb = value.asInt();
    float ratio = 256;
    alpha = ((argb >> 24) & 0xFF) / ratio;
    red = ((argb >> 16) & 0xFF) / ratio;
    green = ((argb >> 8) & 0xFF) / ratio;
    blue = (argb & 0xFF) / ratio;
  } else if (value.isArray()) {
    auto size = value.size();
    assert(size == 3 || size == 4);
    red = value[0].asDouble();
    green = value[1].asDouble();
    blue = value[2].asDouble();
    alpha = size == 4 ? value[3].asDouble() : 1.0;
  } else {
    abort();
  }

  return colorFromComponents(red, green, blue, alpha);
}

std::string colorNameFromColor(SharedColor value) {
  ColorComponents components = colorComponentsFromColor(value);
  const float ratio = 256;
  return "rgba(" +
    folly::to<std::string>(round(components.red * ratio)) + ", " +
    folly::to<std::string>(round(components.green * ratio)) + ", " +
    folly::to<std::string>(round(components.blue * ratio)) + ", " +
    folly::to<std::string>(round(components.alpha * ratio)) + ")";
}

} // namespace react
} // namespace facebook
