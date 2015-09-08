/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

#import "RCTAssert.h"

#define RCT_TEST(name)                  \
- (void)test##name                      \
{                                       \
  [_runner runTest:_cmd module:@#name]; \
}

@interface UIExplorerIntegrationTests : XCTestCase

@end

@implementation UIExplorerIntegrationTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
#if __LP64__
  RCTAssert(NO, @"Tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif

  NSOperatingSystemVersion version = [NSProcessInfo processInfo].operatingSystemVersion;
  RCTAssert(version.majorVersion == 8 || version.minorVersion >= 3, @"Tests should be run on iOS 8.3+, found %zd.%zd.%zd", version.majorVersion, version.minorVersion, version.patchVersion);
  _runner = RCTInitRunnerForApp(@"Examples/UIExplorer/UIExplorerIntegrationTests/js/IntegrationTestsApp", nil);
}

#pragma mark Logic Tests

- (void)testTheTester_waitOneFrame
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"waitOneFrame": @YES}
  expectErrorBlock:nil];
}

- (void)testTheTester_ExpectError
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"shouldThrow": @YES}
  expectErrorRegex:@"because shouldThrow"];
}

RCT_TEST(TimersTest)
RCT_TEST(IntegrationTestHarnessTest)
RCT_TEST(AsyncStorageTest)
// RCT_TEST(LayoutEventsTest) -- Disabled: #8153468
RCT_TEST(AppEventsTest)
RCT_TEST(PromiseTest)
// RCT_TEST(SimpleSnapshotTest) -- Disabled: #8153475

@end
