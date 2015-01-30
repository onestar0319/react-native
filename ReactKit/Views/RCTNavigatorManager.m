// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTNavigatorManager.h"

#import "RCTConvert.h"
#import "RCTNavigator.h"
#import "RCTShadowView.h"

@implementation RCTNavigatorManager

- (UIView *)viewWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
{
  return [[RCTNavigator alloc] initWithFrame:CGRectZero eventDispatcher:eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack)

- (NSDictionary *)customDirectEventTypes
{
  return @{
    @"topNavigationProgress": @{
      @"registrationName": @"onNavigationProgress"
    },
  };
}

@end

