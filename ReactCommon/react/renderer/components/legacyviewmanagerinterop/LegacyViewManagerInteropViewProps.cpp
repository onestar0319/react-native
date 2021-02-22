/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropViewProps.h"
#include <react/renderer/core/DynamicPropsUtilities.h>

namespace facebook {
namespace react {

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      otherProps(
          mergeDynamicProps(sourceProps.otherProps, (folly::dynamic)rawProps)) {
}

} // namespace react
} // namespace facebook
