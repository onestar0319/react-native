/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <React/RCTInspectorPackagerConnection.h>

#if RCT_DEV || RCT_REMOTE_PROFILE

@interface RCTInspectorDevServerHelper : NSObject

+ (id<RCTInspectorPackagerConnectionProtocol>)connectWithBundleURL:(NSURL *)bundleURL;
+ (void)disableDebugger;
+ (void)openDebugger:(NSURL *)bundleURL withErrorMessage:(NSString *)errorMessage;
@end

#endif
