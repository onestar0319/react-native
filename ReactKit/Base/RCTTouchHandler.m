// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTouchHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTAssert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

@implementation RCTTouchHandler
{
  __weak UIView *_rootView;
  RCTEventDispatcher *_eventDispatcher;
  
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

- (instancetype)init
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithTarget:(id)target action:(SEL)action
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
                               rootView:(UIView *)rootView
{
  if ((self = [super initWithTarget:nil action:NULL])) {
    
    RCTAssert(eventDispatcher != nil, @"Expect an event dispatcher");
    RCTAssert(rootView != nil, @"Expect a root view");
    
    _eventDispatcher = eventDispatcher;
    _rootView = rootView;
    
    _nativeTouches = [[NSMutableOrderedSet alloc] init];
    _reactTouches = [[NSMutableArray alloc] init];
    _touchViews = [[NSMutableArray alloc] init];
    
    // `cancelsTouchesInView` is needed in order to be used as a top level event delegated recognizer. Otherwise, lower
    // level components not build using RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    [_rootView addGestureRecognizer:self];
  }
  return self;
}

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
    reactTouch[@"target"] = targetView.reactTag;
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
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:_rootView];
  
  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];
  
  NSMutableDictionary *reactTouch = _reactTouches[touchIndex];
  reactTouch[@"pageX"] = @(rootViewLocation.x);
  reactTouch[@"pageY"] = @(rootViewLocation.y);
  reactTouch[@"locationX"] = @(touchViewLocation.x);
  reactTouch[@"locationY"] = @(touchViewLocation.y);
  reactTouch[@"timestamp"] =  @(nativeTouch.timestamp * 1000); // in ms, for JS
}

- (void)_updateAndDispatchTouches:(NSSet *)touches eventType:(RCTTouchEventType)eventType
{
  // Update touches
  NSMutableArray *changedIndices = [[NSMutableArray alloc] init];
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
    RCTAssert(index != NSNotFound, @"Touch not found. This is a critical bug.");
    [self _updateReactTouchAtIndex:index];
    [changedIndices addObject:@(index)];
  }
  
  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray *reactTouches = [[NSMutableArray alloc] initWithCapacity:_reactTouches.count];
  for (NSDictionary *touch in _reactTouches) {
    [reactTouches addObject:[touch copy]];
  }
  
  // Dispatch touch event
  [_eventDispatcher sendTouchEventWithType:eventType
                                   touches:reactTouches
                            changedIndexes:changedIndices];
}

#pragma mark - Gesture Recognizer Delegate Callbacks

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  self.state = UIGestureRecognizerStateBegan;
  
  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];
  [self _updateAndDispatchTouches:touches eventType:RCTTouchEventTypeStart];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  if (self.state == UIGestureRecognizerStateFailed) {
    return;
  }
  [self _updateAndDispatchTouches:touches eventType:RCTTouchEventTypeMove];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventType:RCTTouchEventTypeEnd];
  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self _updateAndDispatchTouches:touches eventType:RCTTouchEventTypeCancel];
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
