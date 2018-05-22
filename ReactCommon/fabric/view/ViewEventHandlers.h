/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <fabric/core/EventHandlers.h>

namespace facebook {
namespace react {

class ViewEventHandlers;

using SharedViewEventHandlers = std::shared_ptr<const ViewEventHandlers>;

class ViewEventHandlers:
  public EventHandlers {

public:

  using EventHandlers::EventHandlers;

  void onAccessibilityAction(const std::string &name) const;
  void onAccessibilityTap() const;
  void onAccessibilityMagicTap() const;
};

} // namespace react
} // namespace facebook
