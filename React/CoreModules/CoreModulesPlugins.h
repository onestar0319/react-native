/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated by an internal plugin build system
 */

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER

// FB Internal: FBCoreModulesPlugins.h is autogenerated by the build system.
#import <React/FBCoreModulesPlugins.h>

#else

// OSS-compatibility layer

#import <Foundation/Foundation.h>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wreturn-type-c-linkage"

#ifdef __cplusplus
extern "C" {
#endif

// RCTTurboModuleManagerDelegate should call this to resolve module classes.
Class RCTCoreModulesClassProvider(const char *name);

// Lookup functions
Class RCTAccessibilityManagerCls(void) __attribute__((used));
Class RCTAppearanceCls(void) __attribute__((used));
Class RCTDeviceInfoCls(void) __attribute__((used));
Class RCTExceptionsManagerCls(void) __attribute__((used));
Class RCTPlatformCls(void) __attribute__((used));
Class RCTClipboardCls(void) __attribute__((used));
Class RCTI18nManagerCls(void) __attribute__((used));
Class RCTSourceCodeCls(void) __attribute__((used));
Class RCTActionSheetManagerCls(void) __attribute__((used));
Class RCTAlertManagerCls(void) __attribute__((used));
Class RCTAsyncLocalStorageCls(void) __attribute__((used));
Class RCTTimingCls(void) __attribute__((used));

#ifdef __cplusplus
}
#endif

#pragma GCC diagnostic pop

#endif // RN_DISABLE_OSS_PLUGIN_HEADER
