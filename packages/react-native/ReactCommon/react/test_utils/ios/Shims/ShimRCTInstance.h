/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface ShimRCTInstance : NSObject

@property (assign) int initCount;
@property (assign) int invalidateCount;

- (void)reset;

@end
