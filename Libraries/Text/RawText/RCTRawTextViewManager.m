/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTRawTextViewManager.h>

#import <React/RCTRawTextShadowView.h>

@implementation RCTRawTextViewManager

RCT_EXPORT_MODULE(RCTRawText)

- (UIView *)view
{
  return [UIView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTRawTextShadowView new];
}

RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
