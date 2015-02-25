// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTBridge;

typedef NS_ENUM(NSInteger, RCTTextEventType) {
  RCTTextEventTypeFocus,
  RCTTextEventTypeBlur,
  RCTTextEventTypeChange,
  RCTTextEventTypeSubmit,
  RCTTextEventTypeEnd
};

typedef NS_ENUM(NSInteger, RCTScrollEventType) {
  RCTScrollEventTypeStart,
  RCTScrollEventTypeMove,
  RCTScrollEventTypeEnd,
  RCTScrollEventTypeStartDeceleration,
  RCTScrollEventTypeEndDeceleration,
  RCTScrollEventTypeEndAnimation,
};

/**
 * This class wraps the -[RCTBridge enqueueJSCall:args:] method, and
 * provides some convenience methods for generating event calls.
 */
@interface RCTEventDispatcher : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Send a device or application event that does not relate to a specific
 * view, e.g. rotation, location, keyboard show/hide, background/awake, etc.
 */
- (void)sendDeviceEventWithName:(NSString *)name body:(NSDictionary *)body;

/**
 * Send a user input event. The body dictionary must contain a "target"
 * parameter, representing the react tag of the view sending the event
 */
- (void)sendInputEventWithName:(NSString *)name body:(NSDictionary *)body;

/**
 * Send a text input/focus event.
 */
- (void)sendTextEventWithType:(RCTTextEventType)type
                     reactTag:(NSNumber *)reactTag
                         text:(NSString *)text;

/**
 * Send a scroll event.
 * (You can send a fake scroll event by passing nil for scrollView).
 */
- (void)sendScrollEventWithType:(RCTScrollEventType)type
                       reactTag:(NSNumber *)reactTag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData;

@end
