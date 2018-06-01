/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <memory>

#include <fabric/core/ReactPrimitives.h>
#include <fabric/core/EventPrimitives.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

class EventDispatcher;

using SharedEventDispatcher = std::shared_ptr<const EventDispatcher>;

/*
 * Abstract class that represent event-delivery infrastructure.
 * Particular `EventHandlers` clases use an object of this class to invoke
 * events.
 */
class EventDispatcher {

public:

  virtual EventTarget createEventTarget(const InstanceHandle &instanceHandle) const = 0;

  virtual void releaseEventTarget(const EventTarget &eventTarget) const = 0;

  /*
   * Dispatches "raw" event using some event-delivery infrastructure.
   */
  virtual void dispatchEvent(
    const EventTarget &eventTarget,
    const std::string &type,
    const folly::dynamic &payload,
    const EventPriority &priority
  ) const = 0;
};

} // namespace react
} // namespace facebook
