/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRootView.h"

#import "RCTBridge.h"
#import "RCTContextExecutor.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTRedBox.h"
#import "RCTSourceCode.h"
#import "RCTTouchHandler.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTWebViewExecutor.h"
#import "UIView+ReactKit.h"

NSString *const RCTReloadNotification = @"RCTReloadNotification";

@implementation RCTRootView
{
  RCTBridge *_bridge;
  RCTTouchHandler *_touchHandler;
  id<RCTJavaScriptExecutor> _executor;
  BOOL _registered;
}

static Class _globalExecutorClass;

+ (void)initialize
{

#if TARGET_IPHONE_SIMULATOR

  // Register Cmd-R as a global refresh key
  [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                 modifierFlags:UIKeyModifierCommand
                                                        action:^(UIKeyCommand *command) {
                                                          [self reloadAll];
                                                        }];

  // Cmd-D reloads using the web view executor, allows attaching from Safari dev tools.
  [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"d"
                                                 modifierFlags:UIKeyModifierCommand
                                                        action:^(UIKeyCommand *command) {
                                                          _globalExecutorClass = NSClassFromString(@"RCTWebSocketExecutor");
                                                          if (!_globalExecutorClass) {
                                                            RCTLogError(@"WebSocket debugger is not available. Did you forget to include RCTWebSocketExecutor?");
                                                          }
                                                          [self reloadAll];
                                                        }];

#endif

}

- (id)initWithCoder:(NSCoder *)aDecoder
{
  if ((self = [super initWithCoder:aDecoder])) {
    [self setUp];
  }
  return self;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.backgroundColor = [UIColor whiteColor];
    [self setUp];
  }
  return self;
}

- (void)setUp
{
  // Every root view that is created must have a unique react tag.
  // Numbering of these tags goes from 1, 11, 21, 31, etc
  static NSInteger rootViewTag = 1;
  self.reactTag = @(rootViewTag);
  rootViewTag += 10;

  // Add reload observer
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(reload)
                                               name:RCTReloadNotification
                                             object:nil];
}

+ (NSArray *)JSMethods
{
  return @[
    @"AppRegistry.runApplication",
    @"ReactIOS.unmountComponentAtNodeAndRemoveContainer"
  ];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [_bridge enqueueJSCall:@"ReactIOS.unmountComponentAtNodeAndRemoveContainer"
                    args:@[self.reactTag]];
  [self invalidate];
}

#pragma mark - RCTInvalidating

- (BOOL)isValid
{
  return [_bridge isValid];
}

- (void)invalidate
{
  // Clear view
  [self.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];

  [self removeGestureRecognizer:_touchHandler];
  [_touchHandler invalidate];
  [_executor invalidate];

  // TODO: eventually we'll want to be able to share the bridge between
  // multiple rootviews, in which case we'll need to move this elsewhere
  [_bridge invalidate];
}

#pragma mark Bundle loading

- (void)bundleFinishedLoading:(NSError *)error
{
  if (error != nil) {
    NSArray *stack = [[error userInfo] objectForKey:@"stack"];
    if (stack) {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withStack:stack];
    } else {
      [[RCTRedBox sharedInstance] showErrorMessage:[error localizedDescription] withDetails:[error localizedFailureReason]];
    }
  } else {

    [_bridge.uiManager registerRootView:self];
    _registered = YES;

    NSString *moduleName = _moduleName ?: @"";
    NSDictionary *appParameters = @{
      @"rootTag": self.reactTag,
      @"initialProps": self.initialProperties ?: @{},
    };
    [_bridge enqueueJSCall:@"AppRegistry.runApplication"
                      args:@[moduleName, appParameters]];
  }
}

- (void)loadBundle
{
  [self invalidate];

  if (!_scriptURL) {
    return;
  }

  // Clean up
  [self removeGestureRecognizer:_touchHandler];
  [_touchHandler invalidate];
  [_executor invalidate];
  [_bridge invalidate];

  _registered = NO;

  // Choose local executor if specified, followed by global, followed by default
  _executor = [[_executorClass ?: _globalExecutorClass ?: [RCTContextExecutor class] alloc] init];
  _bridge = [[RCTBridge alloc] initWithExecutor:_executor moduleProvider:_moduleProvider];
  _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
  [self addGestureRecognizer:_touchHandler];

  // Load the bundle
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:_scriptURL completionHandler:
                                ^(NSData *data, NSURLResponse *response, NSError *error) {

    // Handle general request errors
    if (error) {
      if ([[error domain] isEqualToString:NSURLErrorDomain]) {
        NSDictionary *userInfo = @{
          NSLocalizedDescriptionKey: @"Could not connect to development server. Ensure node server is running - run 'npm start' from ReactKit root",
          NSLocalizedFailureReasonErrorKey: [error localizedDescription],
          NSUnderlyingErrorKey: error,
        };
        error = [NSError errorWithDomain:@"JSServer"
                                    code:error.code
                                userInfo:userInfo];
      }
      [self bundleFinishedLoading:error];
      return;
    }

    // Parse response as text
    NSStringEncoding encoding = NSUTF8StringEncoding;
    if (response.textEncodingName != nil) {
      CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)response.textEncodingName);
      if (cfEncoding != kCFStringEncodingInvalidId) {
        encoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
      }
    }
    NSString *rawText = [[NSString alloc] initWithData:data encoding:encoding];

    // Handle HTTP errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]] && [(NSHTTPURLResponse *)response statusCode] != 200) {
      NSDictionary *userInfo;
      NSDictionary *errorDetails = RCTJSONParse(rawText, nil);
      if ([errorDetails isKindOfClass:[NSDictionary class]]) {
        userInfo = @{
          NSLocalizedDescriptionKey: errorDetails[@"message"] ?: @"No message provided",
          @"stack": @[@{
            @"methodName": errorDetails[@"description"] ?: @"",
            @"file": errorDetails[@"filename"] ?: @"",
            @"lineNumber": errorDetails[@"lineNumber"] ?: @0
          }]
        };
      } else {
        userInfo = @{NSLocalizedDescriptionKey: rawText};
      }
      error = [NSError errorWithDomain:@"JSServer"
                                  code:[(NSHTTPURLResponse *)response statusCode]
                              userInfo:userInfo];

      [self bundleFinishedLoading:error];
      return;
    }
    if (!_bridge.isValid) {
      return; // Bridge was invalidated in the meanwhile
    }

    // Success!
    RCTSourceCode *sourceCodeModule = _bridge.modules[NSStringFromClass([RCTSourceCode class])];
    sourceCodeModule.scriptURL = _scriptURL;
    sourceCodeModule.scriptText = rawText;

    [_bridge enqueueApplicationScript:rawText url:_scriptURL onComplete:^(NSError *_error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        if (_bridge.isValid) {
          [self bundleFinishedLoading:_error];
        }
      });
    }];

  }];

  [task resume];
}

- (void)setScriptURL:(NSURL *)scriptURL
{
  if ([_scriptURL isEqual:scriptURL]) {
    return;
  }

  _scriptURL = scriptURL;
  [self loadBundle];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_registered) {
    [_bridge.uiManager setFrame:self.frame forRootView:self];
  }
}

- (void)reload
{
  [self loadBundle];
}

+ (void)reloadAll
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification object:nil];
}

- (void)startOrResetInteractionTiming
{
  [_touchHandler startOrResetInteractionTiming];
}

- (NSDictionary *)endAndResetInteractionTiming
{
  return [_touchHandler endAndResetInteractionTiming];
}

@end
