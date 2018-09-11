/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountItemProtocol.h>
#import <React/RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentViewRegistry;

/**
 * Inserts a component view into another component view.
 */
@interface RCTInsertMountItem : NSObject <RCTMountItemProtocol>

- (instancetype)initWithChildTag:(ReactTag)childTag
                       parentTag:(ReactTag)parentTag
                           index:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
