/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTView.h>

//  A RCTView with additional properties and methods for user interaction using the Apple TV focus engine.
@interface RCTTVView : RCTView

/**
 * TV event handlers
 */
@property (nonatomic, assign) BOOL isTVSelectable; // True if this view is TV-focusable

/**
 *  Properties for Apple TV focus parallax effects
 */
@property (nonatomic, copy) NSDictionary *tvParallaxProperties;

/**
 * TV preferred focus
 */
@property (nonatomic, assign) BOOL hasTVPreferredFocus;

@end
