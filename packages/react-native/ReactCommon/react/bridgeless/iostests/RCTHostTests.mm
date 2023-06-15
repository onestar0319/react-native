/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTestUtils/ShimRCTInstance.h>
#import <React/RCTLog.h>
#import <React/RCTMockDef.h>
#import <ReactCommon/RCTHermesInstance.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTInstance.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <OCMock/OCMock.h>

RCT_MOCK_REF(RCTHost, _RCTLogNativeInternal);

RCTLogLevel gLogLevel;
int gLogCalledTimes = 0;
NSString *gLogMessage = nil;
static void RCTLogNativeInternalMock(RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
{
  gLogLevel = level;
  gLogCalledTimes++;

  va_list args;
  va_start(args, format);
  gLogMessage = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
}

@interface RCTHostTests : XCTestCase
@end

@implementation RCTHostTests {
  RCTHost *_subject;
  id<RCTHostDelegate> _mockHostDelegate;
}

static ShimRCTInstance *shimmedRCTInstance;

- (void)setUp
{
  [super setUp];

  shimmedRCTInstance = [ShimRCTInstance new];

  _mockHostDelegate = OCMProtocolMock(@protocol(RCTHostDelegate));
  _subject = [[RCTHost alloc] initWithBundleURL:OCMClassMock([NSURL class])
                                   hostDelegate:_mockHostDelegate
                     turboModuleManagerDelegate:OCMProtocolMock(@protocol(RCTTurboModuleManagerDelegate))
                               jsEngineProvider:^std::shared_ptr<facebook::react::JSEngineInstance>() {
                                 return std::make_shared<facebook::react::RCTHermesInstance>();
                               }];
}

- (void)tearDown
{
  [shimmedRCTInstance reset];
  gLogCalledTimes = 0;
  gLogMessage = nil;

  [super tearDown];
}

- (void)testStart
{
  RCT_MOCK_SET(RCTHost, _RCTLogNativeInternal, RCTLogNativeInternalMock);

  XCTAssertEqual(shimmedRCTInstance.initCount, 0);
  [_subject start];
  OCMVerify(OCMTimes(1), [_mockHostDelegate hostDidStart:_subject]);
  XCTAssertEqual(shimmedRCTInstance.initCount, 1);
  XCTAssertEqual(gLogCalledTimes, 0);

  XCTAssertEqual(shimmedRCTInstance.invalidateCount, 0);
  [_subject start];
  XCTAssertEqual(shimmedRCTInstance.initCount, 2);
  XCTAssertEqual(shimmedRCTInstance.invalidateCount, 1);
  OCMVerify(OCMTimes(2), [_mockHostDelegate hostDidStart:_subject]);
  XCTAssertEqual(gLogLevel, RCTLogLevelWarning);
  XCTAssertEqual(gLogCalledTimes, 1);
  XCTAssertEqualObjects(
      gLogMessage,
      @"RCTHost should not be creating a new instance if one already exists. This implies there is a bug with how/when this method is being called.");

  RCT_MOCK_RESET(RCTHost, _RCTLogNativeInternal);
}

@end
