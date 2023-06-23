/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "IntersectionObserverState.h"

namespace facebook::react {

IntersectionObserverState IntersectionObserverState::Initial() {
  static const IntersectionObserverState state =
      IntersectionObserverState(IntersectionObserverStateType::Initial);
  return state;
}

IntersectionObserverState IntersectionObserverState::NotIntersecting() {
  static const IntersectionObserverState state =
      IntersectionObserverState(IntersectionObserverStateType::NotIntersecting);
  return state;
}

IntersectionObserverState IntersectionObserverState::Intersecting(
    Float threshold) {
  return IntersectionObserverState(
      IntersectionObserverStateType::Intersecting, threshold);
}

IntersectionObserverState::IntersectionObserverState(
    IntersectionObserverStateType state)
    : state_(state) {}

IntersectionObserverState::IntersectionObserverState(
    IntersectionObserverStateType state,
    Float threshold)
    : state_(state), threshold_(threshold) {}

bool IntersectionObserverState::isIntersecting() const {
  return state_ == IntersectionObserverStateType::Intersecting;
}

bool IntersectionObserverState::operator==(
    const IntersectionObserverState &other) const {
  if (state_ != other.state_) {
    return false;
  }

  if (state_ != IntersectionObserverStateType::Intersecting) {
    return true;
  }

  return threshold_ == other.threshold_;
}

bool IntersectionObserverState::operator!=(
    const IntersectionObserverState &other) const {
  return !(*this == other);
}
} // namespace facebook::react
