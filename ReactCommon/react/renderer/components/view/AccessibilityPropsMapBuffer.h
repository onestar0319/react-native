/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mapbuffer/MapBuffer.h>

namespace facebook {
namespace react {

#ifdef ANDROID
constexpr MapBuffer::Key AP_ACCESSIBILITY_ACTIONS = 0;
constexpr MapBuffer::Key AP_ACCESSIBILITY_HINT = 1;
constexpr MapBuffer::Key AP_ACCESSIBILITY_LABEL = 2;
constexpr MapBuffer::Key AP_ACCESSIBILITY_LABELLED_BY = 3;
constexpr MapBuffer::Key AP_ACCESSIBILITY_LIVE_REGION = 4;
constexpr MapBuffer::Key AP_ACCESSIBILITY_ROLE = 5;
constexpr MapBuffer::Key AP_ACCESSIBILITY_STATE = 6;
constexpr MapBuffer::Key AP_ACCESSIBILITY_VALUE = 7;
constexpr MapBuffer::Key AP_ACCESSIBLE = 8;
constexpr MapBuffer::Key AP_IMPORTANT_FOR_ACCESSIBILITY = 19;

// AccessibilityAction values
constexpr MapBuffer::Key ACCESSIBILITY_ACTION_NAME = 0;
constexpr MapBuffer::Key ACCESSIBILITY_ACTION_LABEL = 1;
#endif

} // namespace react
} // namespace facebook
