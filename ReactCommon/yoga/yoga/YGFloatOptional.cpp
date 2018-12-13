/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGFloatOptional.h"
#include <cstdlib>
#include <iostream>
#include "Yoga-internal.h"
#include "Yoga.h"

using namespace facebook;

float YGFloatOptional::getValue() const {
  if (isUndefined()) {
    // Abort, accessing a value of an undefined float optional
    std::cerr << "Tried to get value of an undefined YGFloatOptional\n";
    std::exit(EXIT_FAILURE);
  }
  return value_;
}

bool YGFloatOptional::operator==(YGFloatOptional op) const {
  return value_ == op.value_ || (isUndefined() && op.isUndefined());
}

bool YGFloatOptional::operator!=(YGFloatOptional op) const {
  return !(*this == op);
}

bool YGFloatOptional::operator==(float val) const {
  return value_ == val || (isUndefined() && yoga::isUndefined(val));
}

bool YGFloatOptional::operator!=(float val) const {
  return !(*this == val);
}

YGFloatOptional YGFloatOptional::operator+(YGFloatOptional op) const {
  return YGFloatOptional{value_ + op.value_};
}

bool YGFloatOptional::operator>(YGFloatOptional op) const {
  return value_ > op.value_;
}

bool YGFloatOptional::operator<(YGFloatOptional op) const {
  return value_ < op.value_;
}

bool YGFloatOptional::operator>=(YGFloatOptional op) const {
  return *this > op || *this == op;
}

bool YGFloatOptional::operator<=(YGFloatOptional op) const {
  return *this < op || *this == op;
}
