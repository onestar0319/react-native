---
id: nativemodulesios
title: Native Modules (iOS)
layout: docs
category: Guides
permalink: docs/nativemodulesios.html
next: linking-libraries
---

Sometimes an app needs access to platform API, and React Native doesn't have a corresponding wrapper yet. Maybe you want to reuse some existing Objective-C or C++ code without having to reimplement it in JavaScript. Or write some high performance, multi-threaded code such as image processing, network stack, database or rendering.

We designed React Native such that it is possible for you to write real native code and have access to the full power of the platform. This is a more advanced feature and we don't expect it to be part of the usual development process, however it is essential that it exists. If React Native doesn't support a native feature that you need, you should be able to build it yourself.

This is a more advanced guide that shows how to build a native module. It assumes the reader knows Objective-C (Swift is not supported yet) and core libraries (Foundation, UIKit).

## iOS Calendar module example

This guide will use [iOS Calendar API](https://developer.apple.com/library/mac/documentation/DataManagement/Conceptual/EventKitProgGuide/Introduction/Introduction.html) example. Let's say we would like to be able to access the iOS calendar from JavaScript.

Native module is just an Objective-C class that implements `RCTBridgeModule` protocol. If you are wondering, RCT is a shorthand for ReaCT.

```objective-c
// CalendarManager.h
#import "RCTBridgeModule.h"
#import "RCTLog.h"

@interface CalendarManager : NSObject <RCTBridgeModule>
@end
```

React Native will not expose any methods of `CalendarManager` to JavaScript unless explicitly asked. Fortunately this is pretty easy with `RCT_EXPORT_METHOD`:

```objective-c
// CalendarManager.m
@implementation CalendarManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event %@ at %@", name, location);
}

@end
```

Now from your JavaScript file you can call the method like this:

```javascript
var CalendarManager = require('NativeModules').CalendarManager;
CalendarManager.addEvent('Birthday Party', '4 Privet Drive, Surrey');
```

> **NOTE:** JavaScript method names
> The name of the method exported to JavaScript is the native method's name up to the first colon. React Native also defines a macro called `RCT_REMAP_METHOD` to specify the JavaScript method's name. This is useful when multiple native methods are the same up to the first colon and would have conflicting JavaScript names.

The return type of bridge methods is always `void`. React Native bridge is asynchronous, so the only way to pass a result to JavaScript is by using callbacks or emitting events (see below).

## Argument types

React Native supports several types of arguments that can be passed from JavaScript code to native module:

- string (`NSString`)
- number (`NSInteger`, `float`, `double`, `CGFloat`, `NSNumber`)
- boolean (`BOOL`, `NSNumber`)
- array (`NSArray`) of any types from this list
- map (`NSDictionary`) with string keys and values of any type from this list
- function (`RCTResponseSenderBlock`)

In our `CalendarManager` example, if we want to pass event date to native, we have to convert it to a string or a number:

```objective-c
RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location date:(NSInteger)secondsSinceUnixEpoch)
{
  NSDate *date = [NSDate dateWithTimeIntervalSince1970:secondsSinceUnixEpoch];
}
```

As `CalendarManager.addEvent` method gets more and more complex, the number of arguments will grow. Some of them might be optional. In this case it's worth considering changing the API a little bit to accept a dictionary of event attributes, like this:

```objective-c
#import "RCTConvert.h"

RCT_EXPORT_METHOD(addEvent:(NSString *)name details:(NSDictionary *)details)
{
  NSString *location = [RCTConvert NSString:details[@"location"]]; // ensure location is a string
  ...
}
```

and call it from JavaScript:

```javascript
CalendarManager.addEvent('Birthday Party', {
  location: '4 Privet Drive, Surrey',
  time: date.toTime(),
  description: '...'
})
```

> **NOTE**: About array and map
>
> React Native doesn't provide any guarantees about the types of values in these structures. Your native module might expect an array of strings, but if JavaScript calls your method with an array containing numbers and strings, you'll get `NSArray` with `NSNumber` and `NSString`. It is the developer's responsibility to check array/map value types (see [`RCTConvert`](https://github.com/facebook/react-native/blob/master/React/Base/RCTConvert.h) for helper methods).


## Callbacks

> **WARNING**
>
> This section is even more experimental than others, we don't have a set of best practices around callbacks yet.

Native module also supports a special kind of argument- a callback. In most cases it is used to provide the function call result to JavaScript.

```objective-c
RCT_EXPORT_METHOD(findEvents:(RCTResponseSenderBlock)callback)
{
  NSArray *events = ...
  callback(@[[NSNull null], events]);
}
```

`RCTResponseSenderBlock` accepts only one argument - an array of arguments to pass to the JavaScript callback. In this case we use node's convention to set first argument to error and the rest - to the result of the function.

```javascript
CalendarManager.findEvents((error, events) => {
  if (error) {
    console.error(error);
  } else {
    this.setState({events: events});
  }
})
```

Native module is supposed to invoke its callback only once. It can, however, store the callback as an ivar and invoke it later. This pattern is often used to wrap iOS APIs that require delegate. See [`RCTAlertManager`](https://github.com/facebook/react-native/blob/master/React/Modules/RCTAlertManager.m).

If you want to pass error-like object to JavaScript, use `RCTMakeError` from [`RCTUtils.h`](https://github.com/facebook/react-native/blob/master/React/Base/RCTUtils.h).

## Implementing native module

The native module should not have any assumptions about what thread it is being called on. React Native invokes native modules methods on a separate serial GCD queue, but this is an implementation detail and might change. If the native module needs to call main-thread-only iOS API, it should schedule the operation on the main queue:


```objective-c
RCT_EXPORT_METHOD(addEvent:(NSString *)name callback:(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // Call iOS API on main thread
    ...
    // You can invoke callback from any thread/queue
    callback(@[...]);
  });
}
```

The same way if the operation can take a long time to complete, the native module should not block. It is a good idea to use `dispatch_async` to schedule expensive work on background queue.

## Exporting constants

Native module can export constants that are instantly available to JavaScript at runtime. This is useful to export some initial data that would otherwise require a bridge round-trip.

```objective-c
- (NSDictionary *)constantsToExport
{
  return @{ @"firstDayOfTheWeek": @"Monday" };
}
```

JavaScript can use this value right away:

```javascript
console.log(CalendarManager.firstDayOfTheWeek);
```

Note that the constants are exported only at initialization time, so if you change `constantsToExport` value at runtime it won't affect JavaScript environment.


## Sending events to JavaScript

The native module can signal events to JavaScript without being invoked directly. The easiest way to do this is to use `eventDispatcher`:

```objective-c
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

@implementation CalendarManager

@synthesize bridge = _bridge;

- (void)calendarEventReminderReceived:(NSNotification *)notification
{
  NSString *eventName = notification.userInfo[@"name"];
  [self.bridge.eventDispatcher sendAppEventWithName:@"EventReminder"
                                               body:@{@"name": eventName}];
}

@end
```

JavaScript code can subscribe to these events:

```javascript
var subscription = DeviceEventEmitter.addListener(
  'EventReminder',
  (reminder) => console.log(reminder.name)
);
...
// Don't forget to unsubscribe
subscription.remove();
```
For more examples of sending events to JavaScript, see [`RCTLocationObserver`](https://github.com/facebook/react-native/blob/master/Libraries/Geolocation/RCTLocationObserver.m).
