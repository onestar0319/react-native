/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridge.h"

@class RCTModuleData;

@interface RCTBridge ()

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of RCTBachedBridge. Exposed for
 * test only
 */
- (void)setUp;

/**
 * This method is used to invoke a callback that was registered in the
 * JavaScript application context. Safe to call from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args;

/**
 * This property is mostly used on the main thread, but may be touched from
 * a background thread if the RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) RCTBridge *batchedBridge;

/**
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for the RCTBatchedBridge
 */
@property (nonatomic, copy, readonly) RCTBridgeModuleProviderBlock moduleProvider;

@end

@interface RCTBridge (RCTBatchedBridge)

- (void)registerModuleForFrameUpdates:(RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also suports the fake RCTJSThread
 * queue. Exposed for the RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Systrace profiler toggling methods exposed for the RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Executes native calls sent by JavaScript. Exposed for testing purposes only
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer;

/**
 * Exposed for the RCTJSCExecutor for sending native methods called from
 * JavaScript in the middle of a batch.
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer batchEnded:(BOOL)hasEnded;

/**
 * Exposed for the RCTJSCExecutor for lazily loading native modules
 */
- (NSArray *)configForModuleName:(NSString *)moduleName;

/**
 * Hook exposed for RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end
