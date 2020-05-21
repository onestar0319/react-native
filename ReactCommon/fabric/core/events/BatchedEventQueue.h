/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/EventQueue.h>

namespace facebook {
namespace react {

/*
 * Event Queue that dispatches event in batches synchronizing them with
 * an Event Beat.
 */
class BatchedEventQueue final : public EventQueue {
 public:
  using EventQueue::EventQueue;

  void onEnqueue() const override;

  /*
   * Enqueues and (probably later) dispatch a given event.
   * Deletes previous RawEvent of the same type and with same target
   * from the queue.
   * Can be called on any thread.
   */
  void enqueueUniqueEvent(const RawEvent &rawEvent) const;
};

} // namespace react
} // namespace facebook
