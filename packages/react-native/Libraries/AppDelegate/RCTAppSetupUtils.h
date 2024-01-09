/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

#ifdef __cplusplus

#import <react/config/ReactNativeConfig.h>

#import <memory>

#if USE_HERMES
#if __has_include(<jsireact/HermesExecutorFactory.h>)
#import <jsireact/HermesExecutorFactory.h>
#elif __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#endif
#else // USE_HERMES
#import <React/JSCExecutorFactory.h>
#endif // USE_HERMES

#import <ReactCommon/RCTTurboModuleManager.h>

// Forward declaration to decrease compilation coupling
namespace facebook::react {
class RuntimeScheduler;
}

RCT_EXTERN id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupJsExecutorFactoryForOldArch(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);

/**
 * Register features and experiments prior to app initialization.
 */
void RCTAppSetupPrepareApp(
    UIApplication *application,
    BOOL turboModuleEnabled,
    const facebook::react::ReactNativeConfig &reactNativeConfig);

#endif // __cplusplus

RCT_EXTERN_C_BEGIN

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled)
    __deprecated_msg("Use the 3-argument overload of RCTAppSetupPrepareApp instead");

UIView *RCTAppSetupDefaultRootView(
    RCTBridge *bridge,
    NSString *moduleName,
    NSDictionary *initialProperties,
    BOOL fabricEnabled);

RCT_EXTERN_C_END
