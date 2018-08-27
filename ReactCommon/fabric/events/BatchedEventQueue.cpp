/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BatchedEventQueue.h"

namespace facebook {
namespace react {

void BatchedEventQueue::enqueueEvent(const RawEvent &rawEvent) const {
  EventQueue::enqueueEvent(rawEvent);
  eventBeat_->request();
}

} // namespace react
} // namespace facebook
