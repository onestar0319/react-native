/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated by an internal plugin build system
 */

#ifndef RN_DISABLE_OSS_PLUGIN_HEADER

// OSS-compatibility layer

#import "CoreModulesPlugins.h"

#import <string>
#import <unordered_map>

Class RCTCoreModulesClassProvider(const char *name) {
  static std::unordered_map<std::string, Class (*)(void)> sCoreModuleClassMap = {
    {"AccessibilityManager", RCTAccessibilityManagerCls},
    {"Appearance", RCTAppearanceCls},
    {"DeviceInfo", RCTDeviceInfoCls},
    {"ExceptionsManager", RCTExceptionsManagerCls},
    {"PlatformConstants", RCTPlatformCls},
    {"Clipboard", RCTClipboardCls},
    {"I18nManager", RCTI18nManagerCls},
    {"SourceCode", RCTSourceCodeCls},
    {"ActionSheetManager", RCTActionSheetManagerCls},
    {"AlertManager", RCTAlertManagerCls},
    {"AsyncLocalStorage", RCTAsyncLocalStorageCls},
    {"Timing", RCTTimingCls},
    {"StatusBarManager", RCTStatusBarManagerCls},
    {"KeyboardObserver", RCTKeyboardObserverCls},
    {"AppState", RCTAppStateCls},
    {"PerfMonitor", RCTPerfMonitorCls},
    {"DevMenu", RCTDevMenuCls},
    {"DevSettings", RCTDevSettingsCls},
    {"RedBox", RCTRedBoxCls},
  };

  auto p = sCoreModuleClassMap.find(name);
  if (p != sCoreModuleClassMap.end()) {
    auto classFunc = p->second;
    return classFunc();
  }
  return nil;
}

#endif // RN_DISABLE_OSS_PLUGIN_HEADER
