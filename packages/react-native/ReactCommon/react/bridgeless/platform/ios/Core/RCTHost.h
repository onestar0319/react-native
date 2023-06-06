/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTDefines.h>
#import <react/bridgeless/JSEngineInstance.h>
#import <react/renderer/core/ReactPrimitives.h>

#import "RCTInstance.h"

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTHost;
@class RCTJSThreadManager;
@class RCTModuleRegistry;
FB_RUNTIME_PROTOCOL
@protocol RCTTurboModuleManagerDelegate;

// Runtime API

@protocol RCTHostDelegate <NSObject>

- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal;

- (void)hostDidStart:(RCTHost *)host;

@end

typedef std::shared_ptr<facebook::react::JSEngineInstance> (^RCTHostJSEngineProvider)(void);

@interface RCTHost : NSObject

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                     hostDelegate:(id<RCTHostDelegate>)hostDelegate
       turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider NS_DESIGNATED_INITIALIZER FB_OBJC_DIRECT;

- (void)start;

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

// Renderer API

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(facebook::react::DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTSurfacePresenter *)getSurfacePresenter FB_OBJC_DIRECT;

// Native module API

- (RCTModuleRegistry *)getModuleRegistry FB_OBJC_DIRECT;

@end

NS_ASSUME_NONNULL_END
