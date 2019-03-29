/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTModuleMethod.h>
#import <cxxreact/MessageQueueThread.h>
#import <jsireact/JSCallInvoker.h>
#import <jsireact/TurboModule.h>
#import <unordered_map>
#import <string>

#define RCT_IS_TURBO_MODULE_CLASS(klass) ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTTurboModule)]))
#define RCT_IS_TURBO_MODULE_INSTANCE(module) RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace facebook {
namespace react {

class Instance;

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
public:
  ObjCTurboModule(const std::string &name, id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);

  virtual jsi::Value invokeMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const jsi::Value *args,
      size_t count) override;

  id<RCTTurboModule> instance_;
protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);
private:
  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;
  NSString* getArgumentTypeName(NSString* methodName, int argIndex);

  NSInvocation *getMethodInvocation(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const id<RCTTurboModule> module,
    std::shared_ptr<JSCallInvoker> jsInvoker,
    const std::string& methodName,
    SEL selector,
    const jsi::Value *args,
    size_t count,
    NSMutableArray *retainedObjectsForInvocation);

  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);
};

} // namespace react
} // namespace facebook

@protocol RCTTurboModule <NSObject>
@optional
/**
 * Used by TurboModules to get access to other TurboModules.
 *
 * Usage:
 * Place `@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate`
 * in the @implementation section of your TurboModule.
 */
@property (nonatomic, weak) id<RCTTurboModuleLookupDelegate> turboModuleLookupDelegate;

@optional
// This should be required, after migration is done.
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<facebook::react::JSCallInvoker>)jsInvoker;

@end

// TODO: Consolidate this extension with the one in RCTSurfacePresenter.
@interface RCTBridge ()

- (std::shared_ptr<facebook::react::MessageQueueThread>)jsMessageThread;
- (std::shared_ptr<facebook::react::Instance>)reactInstance;

@end
