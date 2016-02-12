/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <JavaScriptCore/JavaScriptCore.h>

#import "RCTJavaScriptExecutor.h"

/**
 * Default name for the JS thread
 */
RCT_EXTERN NSString *const RCTJSCThreadName;

/**
 * Uses a JavaScriptCore context as the execution engine.
 */
@interface RCTJSCExecutor : NSObject <RCTJavaScriptExecutor>

/**
 * Configures the executor to run JavaScript on a specific thread with a given JS context.
 * You probably don't want to use this; use -init instead.
 */
- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                                 context:(JSContext *)context NS_DESIGNATED_INITIALIZER;

/**
 * Like -[initWithJavaScriptThread:context:] but uses JSGlobalContextRef from JavaScriptCore's C API.
 */
- (instancetype)initWithJavaScriptThread:(NSThread *)javaScriptThread
                        globalContextRef:(JSGlobalContextRef)contextRef;

@end
