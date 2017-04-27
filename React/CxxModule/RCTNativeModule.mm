/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNativeModule.h"

#import <React/RCTBridge.h>
#import <React/RCTBridgeMethod.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTProfile.h>
#import <React/RCTUtils.h>

namespace facebook {
namespace react {

RCTNativeModule::RCTNativeModule(RCTBridge *bridge, RCTModuleData *moduleData)
    : m_bridge(bridge)
    , m_moduleData(moduleData) {}

std::string RCTNativeModule::getName() {
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> RCTNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;

  for (id<RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(
      method.JSMethodName.UTF8String,
      RCTFunctionDescriptorFromType(method.functionType)
    );
  }

  return descs;
}

folly::dynamic RCTNativeModule::getConstants() {
  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways,
    @"[RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = [RCTConvert folly_dynamic:constants];
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  return ret;
}

void RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params) {
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [this, methodId, params=std::move(params)] {
    if (!m_bridge.valid) {
      return;
    }

    invokeInner(methodId, std::move(params));
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;

  if (queue == RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

MethodCallResult RCTNativeModule::callSerializableNativeHook(unsigned int reactMethodId, folly::dynamic &&params) {
  return invokeInner(reactMethodId, std::move(params));
}

MethodCallResult RCTNativeModule::invokeInner(unsigned int methodId, const folly::dynamic &&params) {
  id<RCTBridgeMethod> method = m_moduleData.methods[methodId];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %ud for module: %@",
                methodId, m_moduleData.name);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);

  @try {
    id result = [method invokeWithBridge:m_bridge module:m_moduleData.instance arguments:objcParams];
    return convertIdToFollyDynamic(result);
  }
  @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name hasPrefix:RCTFatalExceptionName]) {
      @throw exception;
    }

    NSString *message = [NSString stringWithFormat:
                         @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                         exception, method.JSMethodName, m_moduleData.name, objcParams];
    RCTFatal(RCTErrorWithMessage(message));
  }

}

}
}
