// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTReachability.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

static NSString *const RCTReachabilityStateUnknown = @"unknown";
static NSString *const RCTReachabilityStateNone = @"none";
static NSString *const RCTReachabilityStateWifi = @"wifi";
static NSString *const RCTReachabilityStateCell = @"cell";

@implementation RCTReachability
{
  SCNetworkReachabilityRef _reachability;
  NSString *_status;
}

@synthesize bridge = _bridge;

static void RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  RCTReachability *self = (__bridge id)info;
  NSString *status = RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    status = RCTReachabilityStateNone;
  }

#if TARGET_OS_IPHONE

  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    status = RCTReachabilityStateCell;
  }

#endif

  else {
    status = RCTReachabilityStateWifi;
  }

  if (![status isEqualToString:self->_status]) {
    self->_status = status;
    [self->_bridge.eventDispatcher sendDeviceEventWithName:@"reachabilityDidChange"
                                                      body:@{@"network_reachability": status}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  if ((self = [super init])) {
    _status = RCTReachabilityStateUnknown;
    _reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, [host UTF8String]);
    SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
    SCNetworkReachabilitySetCallback(_reachability, RCTReachabilityCallback, &context);
    SCNetworkReachabilityScheduleWithRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
  }
  return self;
}

- (instancetype)init
{
  return [self initWithHost:@"http://apple.com"];
}

- (void)dealloc
{
  SCNetworkReachabilityUnscheduleFromRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
  CFRelease(_reachability);
}

#pragma mark - Public API

// TODO: remove error callback - not needed except by Subscribable interface
- (void)getCurrentReachability:(RCTResponseSenderBlock)getSuccess
             withErrorCallback:(__unused RCTResponseSenderBlock)getError
{
  RCT_EXPORT();

  getSuccess(@[@{@"network_reachability": _status}]);
}

@end
