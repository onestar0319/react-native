/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTRootView;

@protocol RCTRootViewDelegate <NSObject>

/**
 * Called after the root view's intrinsic content size is changed.
 *
 * The method is not called when both old size and new size have
 * a dimension that equals to zero.
 *
 * The delegate can use this callback to appropriately resize
 * the root view's frame to fit the new intrinsic content view size,
 * but usually it is not necessary because the root view will also call
 * `setNeedsLayout` for its superview which in its turn will trigger relayout.
 *
 * The new intrinsic content size is available via the `intrinsicContentSize`
 * propery of the root view. The view will not resize itself.
 */
- (void)rootViewDidChangeIntrinsicSize:(RCTRootView *)rootView;

@end
