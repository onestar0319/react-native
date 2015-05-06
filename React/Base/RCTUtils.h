/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <tgmath.h>

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import "RCTAssert.h"
#import "RCTDefines.h"

// Utility functions for JSON object <-> string serialization/deserialization
RCT_EXTERN NSString *RCTJSONStringify(id jsonObject, NSError **error);
RCT_EXTERN id RCTJSONParse(NSString *jsonString, NSError **error);

// Strip non JSON-safe values from an object graph
RCT_EXTERN id RCTJSONClean(id object);

// Get MD5 hash of a string (TODO: currently unused. Remove?)
RCT_EXTERN NSString *RCTMD5Hash(NSString *string);

// Get screen metrics in a thread-safe way
RCT_EXTERN CGFloat RCTScreenScale(void);
RCT_EXTERN CGSize RCTScreenSize(void);

// Round float coordinates to nearest whole screen pixel (not point)
RCT_EXTERN CGFloat RCTRoundPixelValue(CGFloat value);
RCT_EXTERN CGFloat RCTCeilPixelValue(CGFloat value);
RCT_EXTERN CGFloat RCTFloorPixelValue(CGFloat value);

// Get current time, for precise performance metrics
RCT_EXTERN NSTimeInterval RCTTGetAbsoluteTime(void);

// Method swizzling
RCT_EXTERN void RCTSwapClassMethods(Class cls, SEL original, SEL replacement);
RCT_EXTERN void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement);

// Module subclass support
RCT_EXTERN BOOL RCTClassOverridesClassMethod(Class cls, SEL selector);
RCT_EXTERN BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector);

// Creates a standardized error object
// TODO(#6472857): create NSErrors and automatically convert them over the bridge.
RCT_EXTERN NSDictionary *RCTMakeError(NSString *message, id toStringify, NSDictionary *extraData);
RCT_EXTERN NSDictionary *RCTMakeAndLogError(NSString *message, id toStringify, NSDictionary *extraData);

// Returns YES if React is running in a test environment
RCT_EXTERN BOOL RCTRunningInTestEnvironment(void);
