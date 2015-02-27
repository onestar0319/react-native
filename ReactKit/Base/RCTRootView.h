// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@interface RCTRootView : UIView

/**
 * The URL of the bundled application script (required).
 * Setting this will clear the view contents, and trigger
 * an asynchronous load/download and execution of the script.
 */
@property (nonatomic, strong) NSURL *scriptURL;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy) NSString *moduleName;

/**
 * The default properties to apply to the view when the script bundle
 * is first loaded. Defaults to nil/empty.
 */
@property (nonatomic, copy) NSDictionary *initialProperties;

/** 
 * The class of the RCTJavaScriptExecutor to use with this view.
 * If not specified, it will default to using RCTContextExecutor.
 * Changes will take effect next time the bundle is reloaded.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * Reload this root view, or all root views, respectively.
 */
- (void)reload;
+ (void)reloadAll;

- (void)startOrResetInteractionTiming;
- (NSDictionary *)endAndResetInteractionTiming;

@end
