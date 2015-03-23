// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTDatePickerManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "UIView+ReactKit.h"

@implementation RCTDatePickerManager

- (UIView *)view
{
  UIDatePicker *picker = [[UIDatePicker alloc] init];
  [picker addTarget:self
             action:@selector(onChange:)
   forControlEvents:UIControlEventValueChanged];
  return picker;
}

RCT_EXPORT_VIEW_PROPERTY(date)
RCT_EXPORT_VIEW_PROPERTY(minimumDate)
RCT_EXPORT_VIEW_PROPERTY(maximumDate)
RCT_EXPORT_VIEW_PROPERTY(minuteInterval)
RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode)
RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone)

- (void)onChange:(UIDatePicker *)sender
{
  NSDictionary *event = @{
    @"target": sender.reactTag,
    @"timestamp": @([sender.date timeIntervalSince1970] * 1000.0)
  };
  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

- (NSDictionary *)constantsToExport
{
  UIDatePicker *dp = [[UIDatePicker alloc] init];
  return @{
    @"ComponentHeight": @(CGRectGetHeight(dp.frame)),
    @"ComponentWidth": @(CGRectGetWidth(dp.frame)),
    @"DatePickerModes": @{
      @"time": @(UIDatePickerModeTime),
      @"date": @(UIDatePickerModeDate),
      @"datetime": @(UIDatePickerModeDateAndTime),
    }
  };
}

@end
