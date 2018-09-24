/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <React/RCTPrimitives.h>
#import <fabric/core/LayoutConstraints.h>
#import <fabric/core/LayoutContext.h>
#import <fabric/uimanager/FabricUIManager.h>
#import <fabric/uimanager/ShadowViewMutation.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTMountingManager;

/**
 * Exactly same semantic as `facebook::react::SchedulerDelegate`.
 */
@protocol RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::react::ShadowViewMutationList)mutations
                              rootTag:(ReactTag)rootTag;

- (void)schedulerDidRequestPreliminaryViewAllocationWithComponentName:(NSString *)componentName;

@end

/**
 * `facebook::react::Scheduler` as an Objective-C class.
 */
@interface RCTScheduler : NSObject

@property (atomic, weak, nullable) id<RCTSchedulerDelegate> delegate;

- (instancetype)initWithContextContainer:(std::shared_ptr<void>)contextContatiner;

- (void)registerRootTag:(ReactTag)tag;

- (void)unregisterRootTag:(ReactTag)tag;

- (CGSize)measureWithLayoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                         layoutContext:(facebook::react::LayoutContext)layoutContext
                               rootTag:(ReactTag)rootTag;

- (void)constraintLayoutWithLayoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints
                                layoutContext:(facebook::react::LayoutContext)layoutContext
                                      rootTag:(ReactTag)rootTag;

@end

@interface RCTScheduler (Deprecated)

- (std::shared_ptr<facebook::react::FabricUIManager>)uiManager_DO_NOT_USE;

@end

NS_ASSUME_NONNULL_END
