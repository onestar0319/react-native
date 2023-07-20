/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <react/renderer/core/EventPayloadType.h>

namespace facebook::react {

/**
 * Abstract base class for all event payload types.
 */
struct EventPayload {
  virtual ~EventPayload() = default;

  EventPayload() = default;
  EventPayload(const EventPayload &) = default;
  EventPayload &operator=(const EventPayload &) = default;
  EventPayload(EventPayload &&) = default;
  EventPayload &operator=(EventPayload &&) = default;

  virtual jsi::Value asJSIValue(jsi::Runtime &runtime) const = 0;

  /**
   * Reports the type of the event payload for efficient downcasting.
   * When adding a new EventPayload be sure to add a new type of it
   * in `EventPayloadType` and return it from its overriden `getType()` method.
   */
  virtual EventPayloadType getType() const = 0;
};

using SharedEventPayload = std::shared_ptr<const EventPayload>;

} // namespace facebook::react
