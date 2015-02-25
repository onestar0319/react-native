// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTouchHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

// TODO: this class behaves a lot like a module, and could be implemented as a
// module if we were to assume that modules and RootViews had a 1:1 relationship

@implementation RCTTouchHandler
{
  __weak RCTBridge *_bridge;
  
  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the react touch data dictionary.
   * This must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled and we have no other way to recover this information.
   */
  NSMutableOrderedSet *_nativeTouches;
  NSMutableArray *_reactTouches;
  NSMutableArray *_touchViews;
}

- (instancetype)initWithTarget:(id)target action:(SEL)action
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithTarget:nil action:NULL])) {
    
    RCTAssert(bridge != nil, @"Expect an event dispatcher");
    
    _bridge = bridge;
    
    _nativeTouches = [[NSMutableOrderedSet alloc] init];
    _reactTouches = [[NSMutableArray alloc] init];
    _touchViews = [[NSMutableArray alloc] init];
    
    // `cancelsTouchesInView` is needed in order to be used as a top level event delegated recognizer. Otherwise, lower
    // level components not build using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
  }
  return self;
}

typedef NS_ENUM(NSInteger, RCTTouchEventType) {
  RCTTouchEventTypeStart,
  RCTTouchEventTypeMove,
  RCTTouchEventTypeEnd,
  RCTTouchEventTypeCancel
};

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    
    RCTAssert(![_nativeTouches containsObject:touch],
              @"Touch is already recorded. This is a critical bug.");
    
    // Find closest React-managed touchable view
    UIView *targetView = touch.view;
    while (targetView) {
      if (targetView.reactTag && targetView.userInteractionEnabled) { // TODO: implement respondsToTouch: mechanism
        break;
      }
      targetView = targetView.superview;
    }
    
    RCTAssert(targetView.reactTag && targetView.userInteractionEnabled,
              @"No react view found for touch - something went wrong.");

    // Get new, unique touch id
    const NSUInteger RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_reactTouches.lastObject[@"target"] integerValue] + 1) % RCTMaxTouches;
    for (NSDictionary *reactTouch in _reactTouches) {
      NSInteger usedID = [reactTouch[@"target"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID ++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }
    
    // Create touch
    NSMutableDictionary *reactTouch = [[NSMutableDictionary alloc] initWithCapacity:9];
    reactTouch[@"target"] = [targetView reactTagAtPoint:[touch locationInView:targetView]];
    reactTouch[@"identifier"] = @(touchID);
    reactTouch[@"touches"] = [NSNull null];        // We hijack this touchObj to serve both as an event
    reactTouch[@"changedTouches"] = [NSNull null]; // and as a Touch object, so making this JIT friendly.
    
    // Add to arrays
    [_touchViews addObject:targetView];
    [_nativeTouches addObject:touch];
    [_reactTouches addObject:reactTouch];
  }
}

- (void)_recordRemovedTouches:(NSSet *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger index = [_nativeTouches indexOfObject:touch];
    RCTAssert(index != NSNotFound, @"Touch is already removed. This is a critical bug.");
    [_touchViews removeObjectAtIndex:index];
    [_nativeTouches removeObjectAtIndex:index];
    [_reactTouches removeObjectAtIndex:index];
  }
}

- (void)_updateReactTouchAtIndex:(NSInteger)touchIndex
{
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:self.view];
  
  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];
  
  NSMutableDictionary *reactTouch = _reactTouches[touchIndex];
  reactTouch[@"pageX"] = @(rootViewLocation.x);
  reactTouch[@"pageY"] = @(rootViewLocation.y);
  reactTouch[@"locationX"] = @(touchViewLocation.x);
  reactTouch[@"locationY"] = @(touchViewLocation.y);
  reactTouch[@"timestamp"] =  @(nativeTouch.timestamp * 1000); // in ms, for JS
}

/**
 * Constructs information about touch events to send across the serialized
 * boundary. This data should be compliant with W3C `Touch` objects. This data
 * alone isn't sufficient to construct W3C `Event` objects. To construct that,
 * there must be a simple receiver on the other side of the bridge that
 * organizes the touch objects into `Event`s.
 *
 * We send the data as an array of `Touch`es, the type of action
 * (start/end/move/cancel) and the indices that represent "changed" `Touch`es
 * from that array.
 */
- (void)_updateAndDispatchTouches:(NSSet *)touches eventName:(NSString *)eventName
{
  // Update touches
  NSMutableArray *changedIndexes = [[NSMutableArray alloc] init];
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
    RCTAssert(index != NSNotFound, @"Touch not found. This is a critical bug.");
    [self _updateReactTouchAtIndex:index];
    [changedIndexes addObject:@(index)];
  }
  
  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray *reactTouches = [[NSMutableArray alloc] initWithCapacity:_reactTouches.count];
  for (NSDictionary *touch in _reactTouches) {
    [reactTouches addObject:[touch copy]];
  }
  
  // Dispatch touch event
  [_bridge enqueueJSCall:@"RCTEventEmitter.receiveTouches"
                    args:@[eventName, reactTouches, changedIndexes]];
}

#pragma mark - Gesture Recognizer Delegate Callbacks

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  self.state = UIGestureRecognizerStateBegan;
  
  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchStart"];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  if (self.state == UIGestureRecognizerStateFailed) {
    return;
  }
  [self _updateAndDispatchTouches:touches eventName:@"topTouchMove"];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchEnd"];
  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventName:@"topTouchCancel"];
  [self _recordRemovedTouches:touches];
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

@end
