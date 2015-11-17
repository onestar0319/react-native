/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTBridgeMethod.h"
#import "RCTConvert.h"
#import "RCTContextExecutor.h"
#import "RCTFrameUpdate.h"
#import "RCTJavaScriptLoader.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTModuleMap.h"
#import "RCTPerformanceLogger.h"
#import "RCTProfile.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"

#define RCTAssertJSThread() \
  RCTAssert(![NSStringFromClass([_javaScriptExecutor class]) isEqualToString:@"RCTContextExecutor"] || \
              [[[NSThread currentThread] name] isEqualToString:@"com.facebook.React.JavaScript"], \
            @"This method must be called on JS thread")

NSString *const RCTEnqueueNotification = @"RCTEnqueueNotification";
NSString *const RCTDequeueNotification = @"RCTDequeueNotification";

/**
 * Must be kept in sync with `MessageQueue.js`.
 */
typedef NS_ENUM(NSUInteger, RCTBridgeFields) {
  RCTBridgeFieldRequestModuleIDs = 0,
  RCTBridgeFieldMethodIDs,
  RCTBridgeFieldParamss,
};

RCT_EXTERN NSArray<Class> *RCTGetModuleClasses(void);

@interface RCTBridge ()

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(RCTBridge *)bridge;

@end

@interface RCTBatchedBridge : RCTBridge

@property (nonatomic, weak) RCTBridge *parentBridge;

@end

@implementation RCTBatchedBridge
{
  BOOL _loading;
  BOOL _valid;
  BOOL _wasBatchActive;
  __weak id<RCTJavaScriptExecutor> _javaScriptExecutor;
  NSMutableArray<NSArray *> *_pendingCalls;
  NSMutableArray<RCTModuleData *> *_moduleDataByID;
  RCTModuleMap *_modulesByName;
  CADisplayLink *_jsDisplayLink;
  NSMutableSet<RCTModuleData *> *_frameUpdateObservers;
}

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  RCTAssertMainThread();
  RCTAssertParam(bridge);

  if ((self = [super initWithBundleURL:bridge.bundleURL
                        moduleProvider:bridge.moduleProvider
                         launchOptions:bridge.launchOptions])) {

    _parentBridge = bridge;

    /**
     * Set Initial State
     */
    _valid = YES;
    _loading = YES;
    _pendingCalls = [NSMutableArray new];
    _moduleDataByID = [NSMutableArray new];
    _frameUpdateObservers = [NSMutableSet new];
    _jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_jsThreadUpdate:)];

    [RCTBridge setCurrentBridge:self];

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptWillStartLoadingNotification
                                                        object:self
                                                      userInfo:@{ @"bridge": self }];

    [self start];
  }
  return self;
}

- (void)start
{
  dispatch_queue_t bridgeQueue = dispatch_queue_create("com.facebook.react.RCTBridgeQueue", DISPATCH_QUEUE_CONCURRENT);

  dispatch_group_t initModulesAndLoadSource = dispatch_group_create();
  dispatch_group_enter(initModulesAndLoadSource);
  __weak RCTBatchedBridge *weakSelf = self;
  __block NSData *sourceCode;
  [self loadSource:^(NSError *error, NSData *source) {
    if (error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf stopLoadingWithError:error];
      });
    }

    sourceCode = source;
    dispatch_group_leave(initModulesAndLoadSource);
  }];

  // Synchronously initialize all native modules
  [self initModules];

  if (RCTProfileIsProfiling()) {
    // Depends on moduleDataByID being loaded
    RCTProfileHookModules(self);
  }

  __block NSString *config;
  dispatch_group_enter(initModulesAndLoadSource);
  dispatch_async(bridgeQueue, ^{
    dispatch_group_t setupJSExecutorAndModuleConfig = dispatch_group_create();
    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      [weakSelf setupExecutor];
    });

    dispatch_group_async(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      if (weakSelf.isValid) {
        RCTPerformanceLoggerStart(RCTPLNativeModulePrepareConfig);
        config = [weakSelf moduleConfig];
        RCTPerformanceLoggerEnd(RCTPLNativeModulePrepareConfig);
      }
    });

    dispatch_group_notify(setupJSExecutorAndModuleConfig, bridgeQueue, ^{
      // We're not waiting for this complete to leave the dispatch group, since
      // injectJSONConfiguration and executeSourceCode will schedule operations on the
      // same queue anyway.
      RCTPerformanceLoggerStart(RCTPLNativeModuleInjectConfig);
      [weakSelf injectJSONConfiguration:config onComplete:^(NSError *error) {
        RCTPerformanceLoggerEnd(RCTPLNativeModuleInjectConfig);
        if (error) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [weakSelf stopLoadingWithError:error];
          });
        }
      }];
      dispatch_group_leave(initModulesAndLoadSource);
    });
  });

  dispatch_group_notify(initModulesAndLoadSource, dispatch_get_main_queue(), ^{
    RCTBatchedBridge *strongSelf = weakSelf;
    if (sourceCode && strongSelf.loading) {
      dispatch_async(bridgeQueue, ^{
        [weakSelf executeSourceCode:sourceCode];
      });
    }
  });
}

- (void)loadSource:(RCTSourceLoadBlock)_onSourceLoad
{
  RCTPerformanceLoggerStart(RCTPLScriptDownload);
  NSUInteger cookie = RCTProfileBeginAsyncEvent(0, @"JavaScript download", nil);

  RCTSourceLoadBlock onSourceLoad = ^(NSError *error, NSData *source) {
    RCTProfileEndAsyncEvent(0, @"init,download", cookie, @"JavaScript download", nil);
    RCTPerformanceLoggerEnd(RCTPLScriptDownload);

    _onSourceLoad(error, source);
  };

  if ([self.delegate respondsToSelector:@selector(loadSourceForBridge:withBlock:)]) {
    [self.delegate loadSourceForBridge:_parentBridge withBlock:onSourceLoad];
  } else if (self.bundleURL) {
    [RCTJavaScriptLoader loadBundleAtURL:self.bundleURL onComplete:onSourceLoad];
  } else {
    // Allow testing without a script
    dispatch_async(dispatch_get_main_queue(), ^{
      [self didFinishLoading];
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                          object:_parentBridge
                                                        userInfo:@{ @"bridge": self }];
    });
    onSourceLoad(nil, nil);
  }
}

- (void)initModules
{
  RCTAssertMainThread();
  RCTPerformanceLoggerStart(RCTPLNativeModuleInit);

  // Register passed-in module instances
  NSMutableDictionary *preregisteredModules = [NSMutableDictionary new];

  NSArray<id<RCTBridgeModule>> *extraModules = nil;
  if (self.delegate) {
    if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
      extraModules = [self.delegate extraModulesForBridge:_parentBridge];
    }
  } else if (self.moduleProvider) {
    extraModules = self.moduleProvider();
  }

  for (id<RCTBridgeModule> module in extraModules) {
    preregisteredModules[RCTBridgeModuleNameForClass([module class])] = module;
  }

  // Instantiate modules
  _moduleDataByID = [NSMutableArray new];
  NSMutableDictionary *modulesByName = [preregisteredModules mutableCopy];
  for (Class moduleClass in RCTGetModuleClasses()) {
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);

     // Check if module instance has already been registered for this name
     id<RCTBridgeModule> module = modulesByName[moduleName];

     if (module) {
       // Preregistered instances takes precedence, no questions asked
       if (!preregisteredModules[moduleName]) {
         // It's OK to have a name collision as long as the second instance is nil
         RCTAssert([moduleClass new] == nil,
                   @"Attempted to register RCTBridgeModule class %@ for the name "
                   "'%@', but name was already registered by class %@", moduleClass,
                   moduleName, [modulesByName[moduleName] class]);
       }
     } else {
       // Module name hasn't been used before, so go ahead and instantiate
       module = [moduleClass new];
     }
     if (module) {
       modulesByName[moduleName] = module;
     }
  }

  // Store modules
  _modulesByName = [[RCTModuleMap alloc] initWithDictionary:modulesByName];

  /**
   * The executor is a bridge module, wait for it to be created and set it before
   * any other module has access to the bridge
   */
  _javaScriptExecutor = _modulesByName[RCTBridgeModuleNameForClass(self.executorClass)];

  for (id<RCTBridgeModule> module in _modulesByName.allValues) {
    // Bridge must be set before moduleData is set up, as methodQueue
    // initialization requires it (View Managers get their queue by calling
    // self.bridge.uiManager.methodQueue)
    if ([module respondsToSelector:@selector(setBridge:)]) {
      module.bridge = self;
    }

    RCTModuleData *moduleData = [[RCTModuleData alloc] initWithExecutor:_javaScriptExecutor
                                                               moduleID:@(_moduleDataByID.count)
                                                               instance:module];
    [_moduleDataByID addObject:moduleData];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTDidCreateNativeModules
                                                      object:self];
  RCTPerformanceLoggerEnd(RCTPLNativeModuleInit);
}

- (void)setupExecutor
{
  [_javaScriptExecutor setUp];
}

- (NSString *)moduleConfig
{
  NSMutableArray<NSArray *> *config = [NSMutableArray new];
  for (RCTModuleData *moduleData in _moduleDataByID) {
    [config addObject:moduleData.config];
    if ([moduleData.instance conformsToProtocol:@protocol(RCTFrameUpdateObserver)]) {
      [_frameUpdateObservers addObject:moduleData];
      id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
      __weak typeof(self) weakSelf = self;
      __weak typeof(_javaScriptExecutor) weakJavaScriptExecutor = _javaScriptExecutor;
      observer.pauseCallback = ^{
        [weakJavaScriptExecutor executeBlockOnJavaScriptQueue:^{
          [weakSelf updateJSDisplayLinkState];
        }];
      };
    }
  }

  return RCTJSONStringify(@{
    @"remoteModuleConfig": config,
  }, NULL);
}

- (void)updateJSDisplayLinkState
{
  RCTAssertJSThread();

  BOOL pauseDisplayLink = YES;
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (!observer.paused) {
      pauseDisplayLink = NO;
      break;
    }
  }
  _jsDisplayLink.paused = pauseDisplayLink;
}

- (void)injectJSONConfiguration:(NSString *)configJSON
                     onComplete:(void (^)(NSError *))onComplete
{
  if (!self.valid) {
    return;
  }

  [_javaScriptExecutor injectJSONText:configJSON
                  asGlobalObjectNamed:@"__fbBatchedBridgeConfig"
                             callback:onComplete];
}

- (void)executeSourceCode:(NSData *)sourceCode
{
  if (!self.valid || !_javaScriptExecutor) {
    return;
  }

  RCTSourceCode *sourceCodeModule = self.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
  sourceCodeModule.scriptURL = self.bundleURL;
  sourceCodeModule.scriptData = sourceCode;

  [self enqueueApplicationScript:sourceCode url:self.bundleURL onComplete:^(NSError *loadError) {
    if (!self.isValid) {
      return;
    }

    if (loadError) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [self stopLoadingWithError:loadError];
      });
      return;
    }

    // Register the display link to start sending js calls after everything is setup
    NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTContextExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
    [_jsDisplayLink addToRunLoop:targetRunLoop forMode:NSRunLoopCommonModes];

    // Perform the state update and notification on the main thread, so we can't run into
    // timing issues with RCTRootView
    dispatch_async(dispatch_get_main_queue(), ^{
      [self didFinishLoading];

      [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                          object:_parentBridge
                                                        userInfo:@{ @"bridge": self }];
    });
  }];
}

- (void)didFinishLoading
{
  _loading = NO;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    for (NSArray *call in _pendingCalls) {
      [self _actuallyInvokeAndProcessModule:call[0]
                                     method:call[1]
                                  arguments:call[2]];
    }
  }];
}

- (void)stopLoadingWithError:(NSError *)error
{
  RCTAssertMainThread();

  if (!self.isValid || !self.loading) {
    return;
  }

  _loading = NO;

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidFailToLoadNotification
                                                      object:_parentBridge
                                                    userInfo:@{@"bridge": self, @"error": error}];
  RCTFatal(error);
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithBundleURL:(__unused NSURL *)bundleURL
                    moduleProvider:(__unused RCTBridgeModuleProviderBlock)block
                    launchOptions:(__unused NSDictionary *)launchOptions)

/**
 * Prevent super from calling setUp (that'd create another batchedBridge)
 */
- (void)setUp {}
- (void)bindKeys {}

- (void)reload
{
  [_parentBridge reload];
}

- (Class)executorClass
{
  return _parentBridge.executorClass ?: [RCTContextExecutor class];
}

- (void)setExecutorClass:(Class)executorClass
{
  RCTAssertMainThread();

  _parentBridge.executorClass = executorClass;
}

- (NSURL *)bundleURL
{
  return _parentBridge.bundleURL;
}

- (void)setBundleURL:(NSURL *)bundleURL
{
  _parentBridge.bundleURL = bundleURL;
}

- (id<RCTBridgeDelegate>)delegate
{
  return _parentBridge.delegate;
}

- (BOOL)isLoading
{
  return _loading;
}

- (BOOL)isValid
{
  return _valid;
}

- (NSDictionary *)modules
{
  if (RCT_DEBUG && self.isValid && _modulesByName == nil) {
    RCTLogError(@"Bridge modules have not yet been initialized. You may be "
                "trying to access a module too early in the startup procedure.");
  }
  return _modulesByName;
}

#pragma mark - RCTInvalidating

- (void)invalidate
{
  if (!self.valid) {
    return;
  }

  RCTAssertMainThread();

  _loading = NO;
  _valid = NO;
  if ([RCTBridge currentBridge] == self) {
    [RCTBridge setCurrentBridge:nil];
  }

  // Invalidate modules
  dispatch_group_t group = dispatch_group_create();
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if (moduleData.instance == _javaScriptExecutor) {
      continue;
    }

    if ([moduleData.instance respondsToSelector:@selector(invalidate)]) {
      [moduleData dispatchBlock:^{
        [(id<RCTInvalidating>)moduleData.instance invalidate];
      } dispatchGroup:group];
    }
    moduleData.queue = nil;
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
      [_jsDisplayLink invalidate];
      _jsDisplayLink = nil;

      [_javaScriptExecutor invalidate];
      _javaScriptExecutor = nil;

      if (RCTProfileIsProfiling()) {
        RCTProfileUnhookModules(self);
      }
      _moduleDataByID = nil;
      _modulesByName = nil;
      _frameUpdateObservers = nil;

    }];
  });
}

- (void)logMessage:(NSString *)message level:(NSString *)level
{
  if (RCT_DEBUG) {
    [_javaScriptExecutor executeJSCall:@"RCTLog"
                                method:@"logIfNoNativeHook"
                             arguments:@[level, message]
                              callback:^(__unused id json, __unused NSError *error) {}];
  }
}

#pragma mark - RCTBridge methods

/**
 * Public. Can be invoked from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args
{
  NSArray<NSString *> *ids = [moduleDotMethod componentsSeparatedByString:@"."];

  [self _invokeAndProcessModule:@"BatchedBridge"
                         method:@"callFunctionReturnFlushedQueue"
                      arguments:@[ids[0], ids[1], args ?: @[]]];
}

/**
 * Private hack to support `setTimeout(fn, 0)`
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer
{
  RCTAssertJSThread();

  dispatch_block_t block = ^{
    [self _actuallyInvokeAndProcessModule:@"BatchedBridge"
                                   method:@"callFunctionReturnFlushedQueue"
                                arguments:@[@"JSTimersExecution", @"callTimers", @[@[timer]]]];
  };

  if ([_javaScriptExecutor respondsToSelector:@selector(executeAsyncBlockOnJavaScriptQueue:)]) {
    [_javaScriptExecutor executeAsyncBlockOnJavaScriptQueue:block];
  } else {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  }
}

- (void)enqueueApplicationScript:(NSData *)script
                             url:(NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  RCTAssert(onComplete != nil, @"onComplete block passed in should be non-nil");

  RCTProfileBeginFlowEvent();
  [_javaScriptExecutor executeApplicationScript:script sourceURL:url onComplete:^(NSError *scriptLoadError) {
    RCTProfileEndFlowEvent();
    RCTAssertJSThread();

    if (scriptLoadError) {
      onComplete(scriptLoadError);
      return;
    }

    RCT_PROFILE_BEGIN_EVENT(0, @"FetchApplicationScriptCallbacks", nil);
    [_javaScriptExecutor executeJSCall:@"BatchedBridge"
                                method:@"flushedQueue"
                             arguments:@[]
                              callback:^(id json, NSError *error)
     {
       RCT_PROFILE_END_EVENT(0, @"js_call,init", @{
         @"json": RCTNullIfNil(json),
         @"error": RCTNullIfNil(error),
       });

       [self handleBuffer:json batchEnded:YES];

       onComplete(error);
     }];
  }];
}

#pragma mark - Payload Generation

/**
 * Called by enqueueJSCall from any thread, or from _immediatelyCallTimer,
 * on the JS thread, but only in non-batched mode.
 */
- (void)_invokeAndProcessModule:(NSString *)module method:(NSString *)method arguments:(NSArray *)args
{
  /**
   * AnyThread
   */

  RCTProfileBeginFlowEvent();

  __weak RCTBatchedBridge *weakSelf = self;
  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEndFlowEvent();

    RCTBatchedBridge *strongSelf = weakSelf;
    if (!strongSelf || !strongSelf.valid) {
      return;
    }

    if (strongSelf.loading) {
      [strongSelf->_pendingCalls addObject:@[module, method, args]];
    } else {
      [strongSelf _actuallyInvokeAndProcessModule:module method:method arguments:args];
    }
  }];
}

- (void)_actuallyInvokeAndProcessModule:(NSString *)module
                                 method:(NSString *)method
                              arguments:(NSArray *)args
{
  RCTAssertJSThread();

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTEnqueueNotification object:nil userInfo:nil];

  RCTJavaScriptCallback processResponse = ^(id json, NSError *error) {
    if (error) {
      RCTFatal(error);
    }

    if (!self.isValid) {
      return;
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTDequeueNotification object:nil userInfo:nil];
    [self handleBuffer:json batchEnded:YES];
  };

  [_javaScriptExecutor executeJSCall:module
                              method:method
                           arguments:args
                            callback:processResponse];
}

#pragma mark - Payload Processing

- (void)handleBuffer:(id)buffer batchEnded:(BOOL)batchEnded
{
  RCTAssertJSThread();

  if (buffer != nil && buffer != (id)kCFNull) {
    _wasBatchActive = YES;
    [self handleBuffer:buffer];
  }

  if (batchEnded) {
    if (_wasBatchActive) {
      [self batchDidComplete];
    }

    _wasBatchActive = NO;
  }
}

- (void)handleBuffer:(NSArray<NSArray *> *)buffer
{
  NSArray<NSArray *> *requestsArray = [RCTConvert NSArrayArray:buffer];

  if (RCT_DEBUG && requestsArray.count <= RCTBridgeFieldParamss) {
    RCTLogError(@"Buffer should contain at least %tu sub-arrays. Only found %tu",
                RCTBridgeFieldParamss + 1, requestsArray.count);
    return;
  }

  NSArray<NSNumber *> *moduleIDs = requestsArray[RCTBridgeFieldRequestModuleIDs];
  NSArray<NSNumber *> *methodIDs = requestsArray[RCTBridgeFieldMethodIDs];
  NSArray<NSArray *> *paramsArrays = requestsArray[RCTBridgeFieldParamss];

  if (RCT_DEBUG && (moduleIDs.count != methodIDs.count || moduleIDs.count != paramsArrays.count)) {
    RCTLogError(@"Invalid data message - all must be length: %zd", moduleIDs.count);
    return;
  }

  NSMapTable *buckets = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                                  valueOptions:NSPointerFunctionsStrongMemory
                                                      capacity:_moduleDataByID.count];

  [moduleIDs enumerateObjectsUsingBlock:^(NSNumber *moduleID, NSUInteger i, __unused BOOL *stop) {
    RCTModuleData *moduleData = _moduleDataByID[moduleID.integerValue];
    if (RCT_DEBUG) {
      // verify that class has been registered
      (void)_modulesByName[moduleData.name];
    }
    dispatch_queue_t queue = moduleData.queue;
    NSMutableOrderedSet<NSNumber *> *set = [buckets objectForKey:queue];
    if (!set) {
      set = [NSMutableOrderedSet new];
      [buckets setObject:set forKey:queue];
    }
    [set addObject:@(i)];
  }];

  for (dispatch_queue_t queue in buckets) {
    RCTProfileBeginFlowEvent();

    dispatch_block_t block = ^{
      RCTProfileEndFlowEvent();

#if RCT_DEV
      NSString *_threadName = RCTCurrentThreadName();
      RCT_PROFILE_BEGIN_EVENT(0, _threadName, nil);
#endif

      NSOrderedSet *calls = [buckets objectForKey:queue];
      @autoreleasepool {
        for (NSNumber *indexObj in calls) {
          NSUInteger index = indexObj.unsignedIntegerValue;
          [self _handleRequestNumber:index
                            moduleID:[moduleIDs[index] integerValue]
                            methodID:[methodIDs[index] integerValue]
                              params:paramsArrays[index]];
        }
      }

      RCT_PROFILE_END_EVENT(0, @"objc_call,dispatch_async", @{
        @"calls": @(calls.count),
      });
    };

    if (queue == RCTJSThread) {
      [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
    } else if (queue) {
      dispatch_async(queue, block);
    }
  }
}

- (void)batchDidComplete
{
  // TODO: batchDidComplete is only used by RCTUIManager - can we eliminate this special case?
  for (RCTModuleData *moduleData in _moduleDataByID) {
    if ([moduleData.instance respondsToSelector:@selector(batchDidComplete)]) {
      [moduleData dispatchBlock:^{
        [moduleData.instance batchDidComplete];
      }];
    }
  }
}

- (BOOL)_handleRequestNumber:(NSUInteger)i
                    moduleID:(NSUInteger)moduleID
                    methodID:(NSUInteger)methodID
                      params:(NSArray *)params
{
  if (!self.isValid) {
    return NO;
  }

  if (RCT_DEBUG && ![params isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Invalid module/method/params tuple for request #%zd", i);
    return NO;
  }

  RCTModuleData *moduleData = _moduleDataByID[moduleID];
  if (RCT_DEBUG && !moduleData) {
    RCTLogError(@"No module found for id '%zd'", moduleID);
    return NO;
  }

  id<RCTBridgeMethod> method = moduleData.methods[methodID];
  if (RCT_DEBUG && !method) {
    RCTLogError(@"Unknown methodID: %zd for module: %zd (%@)", methodID, moduleID, moduleData.name);
    return NO;
  }

  RCT_PROFILE_BEGIN_EVENT(0, [NSString stringWithFormat:@"[%@ %@]", moduleData.name, method.JSMethodName], nil);

  @try {
    [method invokeWithBridge:self module:moduleData.instance arguments:params];
  }
  @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name isEqualToString:RCTFatalExceptionName]) {
      @throw exception;
    }

    NSString *message = [NSString stringWithFormat:
                         @"Exception thrown while invoking %@ on target %@ with params %@: %@",
                         method.JSMethodName, moduleData.name, params, exception];
    RCTFatal(RCTErrorWithMessage(message));
  }

  if (RCTProfileIsProfiling()) {
    NSMutableDictionary *args = [method.profileArgs mutableCopy];
    args[@"method"] = method.JSMethodName;
    args[@"args"] = RCTJSONStringify(RCTNullIfNil(params), NULL);
    RCT_PROFILE_END_EVENT(0, @"objc_call", args);
  }

  return YES;
}

- (void)_jsThreadUpdate:(CADisplayLink *)displayLink
{
  RCTAssertJSThread();
  RCT_PROFILE_BEGIN_EVENT(0, @"DispatchFrameUpdate", nil);

  RCTFrameUpdate *frameUpdate = [[RCTFrameUpdate alloc] initWithDisplayLink:displayLink];
  for (RCTModuleData *moduleData in _frameUpdateObservers) {
    id<RCTFrameUpdateObserver> observer = (id<RCTFrameUpdateObserver>)moduleData.instance;
    if (!observer.paused) {
      RCT_IF_DEV(NSString *name = [NSString stringWithFormat:@"[%@ didUpdateFrame:%f]", observer, displayLink.timestamp];)
      RCTProfileBeginFlowEvent();

      [moduleData dispatchBlock:^{
        RCTProfileEndFlowEvent();
        RCT_PROFILE_BEGIN_EVENT(0, name, nil);
        [observer didUpdateFrame:frameUpdate];
        RCT_PROFILE_END_EVENT(0, @"objc_call,fps", nil);
      }];
    }
  }

  [self updateJSDisplayLinkState];


  RCTProfileImmediateEvent(0, @"JS Thread Tick", 'g');

  RCT_PROFILE_END_EVENT(0, @"objc_call", nil);
}

- (void)startProfiling
{
  RCTAssertMainThread();

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileInit(self);
  }];
}

- (void)stopProfiling:(void (^)(NSData *))callback
{
  RCTAssertMainThread();

  [_javaScriptExecutor executeBlockOnJavaScriptQueue:^{
    RCTProfileEnd(self, ^(NSString *log) {
      NSData *logData = [log dataUsingEncoding:NSUTF8StringEncoding];
      callback(logData);
    });
  }];
}

@end
