/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This protocol should be adopted when a turbo module needs to directly call into JavaScript.
 * In bridge-less React Native, it is a replacement for [_bridge enqueueJSCall:].
 */
@protocol RCTJSInvokerModule

@optional
@property (nonatomic, copy) void (^invokeJS)(NSString *module, NSString *method, NSArray *args);

@end
