/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMaskedView.h"

#import <React/UIView+React.h>

@implementation RCTMaskedView

- (void)didUpdateReactSubviews
{
  // RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.reactSubviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.reactSubviews.count; i++) {
    UIView *subview = [self.reactSubviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  // RCTView uses displayLayer to do border rendering.
  // We don't need to do that in RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
