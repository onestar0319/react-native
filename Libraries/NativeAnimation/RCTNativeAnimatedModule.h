/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "RCTBridgeModule.h"
#import "RCTValueAnimatedNode.h"
#import "RCTEventEmitter.h"
#import "RCTEventDispatcher.h"

@interface RCTNativeAnimatedModule : RCTEventEmitter <RCTBridgeModule, RCTValueAnimatedNodeObserver, RCTEventDispatcherObserver>

@end
