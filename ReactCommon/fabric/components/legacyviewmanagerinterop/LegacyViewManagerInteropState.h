/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <string>

namespace facebook {
namespace react {

/*
 * State for <LegacyViewManagerInterop> component.
 */
class LegacyViewManagerInteropState final {
 public:
  std::string componentName;
};

} // namespace react
} // namespace facebook
