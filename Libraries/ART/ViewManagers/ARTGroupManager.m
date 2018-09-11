/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ARTGroupManager.h"

#import "ARTGroup.h"
#import "RCTConvert+ART.h"

@implementation ARTGroupManager

RCT_EXPORT_MODULE()

- (ARTNode *)node
{
  return [ARTGroup new];
}

RCT_EXPORT_VIEW_PROPERTY(clipping, CGRect)

@end
