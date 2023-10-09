/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

/**
 * FNV-1a hash function implementation.
 * Implemented as described in http://www.isthe.com/chongo/tech/comp/fnv/.
 *
 * Please use std::hash if possible. `fnv1a` should only be used in cases
 * when std::hash does not provide the needed functionality. For example,
 * constexpr.
 */
constexpr uint32_t fnv1a(std::string_view string) noexcept {
  constexpr uint32_t offset_basis = 2166136261;

  uint32_t hash = offset_basis;

  for (auto const& c : string) {
    hash ^= static_cast<int8_t>(c);
    // Using shifts and adds instead of multiplication with a prime number.
    // This is faster when compiled with optimizations.
    hash +=
        (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return hash;
}

} // namespace facebook::react
