/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIView+ComponentViewProtocol.h"

#import <React/RCTAssert.h>

@implementation UIView (ComponentViewProtocol)

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index
{
  [self insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index
{
  RCTAssert(childComponentView.superview == self, @"Attempt to unmount improperly mounted component view.");
  [childComponentView removeFromSuperview];
}

- (void)updateProps:(facebook::react::SharedProps)props
           oldProps:(facebook::react::SharedProps)oldProps
{
  // Default implementation does nothing.
}

- (void)updateLayoutMetrics:(facebook::react::LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(facebook::react::LayoutMetrics)oldLayoutMetrics
{
  if (layoutMetrics.frame != oldLayoutMetrics.frame) {
    self.frame = {
      .origin = {
        .x = layoutMetrics.frame.origin.x,
        .y = layoutMetrics.frame.origin.y
      },
      .size = {
        .width = layoutMetrics.frame.size.width,
        .height = layoutMetrics.frame.size.height
      }
    };
  }

  // TODO: Apply another layout metrics here.
}

- (void)prepareForRecycle
{
  // Default implementation does nothing.
}

@end
